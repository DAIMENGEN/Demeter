import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {App, Button, Card, Result, Space, Spin} from "antd";
import dayjs from "dayjs";
import {
    type Checkpoint,
    type CheckpointMoveMountArg,
    type Event,
    type EventMoveMountArg,
    type EventResizeMountArg,
    type Milestone,
    type MilestoneMoveMountArg,
    type Resource,
    type ResourceAreaColumn,
    Schedulant
} from "schedulant";
import {
    type JsonValue,
    TaskType,
    TaskTypeLabels,
    type TaskAttributeConfig,
    useDeleteTask,
    useProjectById,
    useReorderTasks,
    useTaskAttributeConfigs,
    useTasks,
    useUpdateTask
} from "@Webapp/api/modules/project";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import weekOfYear from "dayjs/plugin/weekOfYear";
import weekYear from "dayjs/plugin/weekYear";
import {useSchedulantHeight} from "./hooks.ts";
import {
    CreateTaskDrawer,
    EditTaskDrawer,
    GanttLegend,
    GanttToolbar,
    type LegendItem,
    ProjectInfo,
    TaskAttributeConfigDrawer,
    viewDefaultRangeMap,
    type ViewType,
    viewUnitMap
} from "./components";
import {normalizeColorMapToRows, normalizeOptionsToRows, normalizeUserOptionsToRows} from "./components/task-attribute-config-drawer/serializers.ts";
import "schedulant/dist/schedulant.css";
import "./project-detail.scss";

dayjs.extend(isSameOrBefore);
dayjs.extend(quarterOfYear);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);

/**
 * Backend expects chrono::NaiveDateTime which can't parse ISO strings with milliseconds/timezone.
 * Use a stable 'YYYY-MM-DDTHH:mm:ss' format.
 */
const toNaiveDateTimeString = (value: Date | dayjs.Dayjs) => {
    const d = dayjs(value);
    return d.format("YYYY-MM-DDTHH:mm:ss");
};

const safeDayjs = (value: string) => {
    const d = dayjs(value);
    return d.isValid() ? d : dayjs();
};

type ColorMap = ReadonlyMap<string, string>;

// 列 key 直接用 string

type AvailableColumn = {
    key: string;
    label: string;
    locked?: boolean;
    defaultVisible?: boolean;
};

const RESOURCE_COLUMN_TITLE_KEY = "title";
const CUSTOM_ATTRIBUTE_PREFIX = "ca.";

const ensureTitleSelected = (keys: readonly string[]) => {
    const set = new Set(keys);
    set.add(RESOURCE_COLUMN_TITLE_KEY);
    return Array.from(set);
};

const normalizeExtendedPropValue = (v: unknown): string | number | boolean | null | undefined => {
    if (v == null) return v as null | undefined;
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return v;
    return null;
};

const buildColorMap = (valueColorMap: JsonValue | null): ColorMap => {
    const rows = normalizeColorMapToRows(valueColorMap);
    return new Map(rows.map((r) => [r.value, r.color] as const));
};

const buildSelectValueLabelMap = (options: JsonValue | null): DisplayValueMap => {
    const rows = normalizeOptionsToRows(options);
    return new Map(rows.map((r) => [String(r.value), r.label] as const));
};

const buildUserValueLabelMap = (options: JsonValue | null): DisplayValueMap => {
    const rows = normalizeUserOptionsToRows(options);
    // user rows value is { value: string; label: string }
    const pairs: Array<readonly [string, string]> = [];
    for (const r of rows) {
        const v = r.value;
        if (typeof v === "string") continue;
        pairs.push([v.value, r.label]);
    }
    return new Map(pairs);
};

const toScalarString = (v: JsonValue | undefined): string | null => {
    if (v == null) return null;
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    return null;
};

const toUserIdFromJson = (v: JsonValue | undefined): string | null => {
    if (v == null) return null;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
    if (typeof v === "object" && !Array.isArray(v)) {
        const obj = v as Record<string, JsonValue>;
        const inner = obj.value;
        if (typeof inner === "string" || typeof inner === "number" || typeof inner === "boolean") return String(inner);
    }
    return null;
};

const getDisplayFieldKey = (key: string): string => {
    // taskType 显示 label
    if (key === "taskType") return "taskTypeLabel";
    // 自定义字段一律用 <key>Label 展示（key 已包含 ca. 前缀）
    if (key.startsWith(CUSTOM_ATTRIBUTE_PREFIX)) return `${key}Label`;
    return key;
};

const tasksToSchedulantModels = (
    tasks: import("@Webapp/api/modules/project").Task[],
    colorRenderAttributeName: string | null,
    colorMap: ColorMap | null,
    attributeConfigs: readonly TaskAttributeConfig[]
) => {
    const configByName = new Map(attributeConfigs.map((c) => [c.attributeName, c] as const));

    const selectLabelMaps = new Map<string, DisplayValueMap>();
    const userLabelMaps = new Map<string, DisplayValueMap>();

    for (const c of attributeConfigs) {
        if (!c.attributeName) continue;
        if (c.attributeType === "select") {
            selectLabelMaps.set(c.attributeName, buildSelectValueLabelMap(c.options));
        }
        if (c.attributeType === "user") {
            userLabelMaps.set(c.attributeName, buildUserValueLabelMap(c.options));
        }
    }

    const resources: Resource[] = tasks.map((t) => {
        const baseExtendedProps: Record<string, unknown> = {
            order: t.order ?? undefined,
            taskType: t.taskType,
            taskTypeLabel: TaskTypeLabels[(t.taskType as TaskType) ?? TaskType.UNKNOWN] ?? String(t.taskType),
            startDateTime: t.startDateTime,
            endDateTime: t.endDateTime,
            parentId: t.parentId ?? null,
        };

        const ca = t.customAttributes;
        if (ca && typeof ca === "object" && !Array.isArray(ca)) {
            const caObj = ca as Record<string, JsonValue>;
            for (const [k, v] of Object.entries(caObj)) {
                const storedKey = `${CUSTOM_ATTRIBUTE_PREFIX}${k}`;
                baseExtendedProps[storedKey] = v;

                const cfg = configByName.get(k);
                if (cfg?.attributeType === "select") {
                    const raw = toScalarString(v);
                    const label = raw ? selectLabelMaps.get(k)?.get(raw) : null;
                    baseExtendedProps[`${storedKey}Label`] = label ?? raw;
                    continue;
                }

                if (cfg?.attributeType === "user") {
                    const userId = toUserIdFromJson(v);
                    const label = userId ? userLabelMaps.get(k)?.get(userId) : null;
                    baseExtendedProps[`${storedKey}Label`] = label ?? userId;
                    continue;
                }

                // 其它类型：尽量转为可读字符串
                baseExtendedProps[`${storedKey}Label`] = toScalarString(v);
            }
        }

        return {
            id: t.id,
            title: t.taskName,
            parentId: t.parentId ?? undefined,
            extendedProps: baseExtendedProps,
        };
    });

    const getColorForTask = (t: import("@Webapp/api/modules/project").Task): string | undefined => {
        if (!colorRenderAttributeName || !colorMap) return undefined;
        const attrs = t.customAttributes;
        if (!attrs || typeof attrs !== "object" || Array.isArray(attrs)) return undefined;
        const raw = (attrs as Record<string, JsonValue>)[colorRenderAttributeName];
        const value = jsonValueToString(raw);
        if (!value) return undefined;
        return colorMap.get(value);
    };

    const events: Event[] = [];
    const milestones: Milestone[] = [];
    const checkpoints: Checkpoint[] = [];

    for (const t of tasks) {
        const start = safeDayjs(t.startDateTime);
        const end = safeDayjs(t.endDateTime);
        const color = getColorForTask(t);

        if (t.taskType === TaskType.MILESTONE) {
            milestones.push({
                id: t.id,
                title: t.taskName,
                time: start,
                status: "Success",
                resourceId: t.id,
                ...(color ? {color} : {})
            });
            continue;
        }

        if (t.taskType === TaskType.CHECKPOINT) {
            checkpoints.push({
                id: t.id,
                title: t.taskName,
                time: start,
                resourceId: t.id,
                ...(color ? {color} : {color: "green"})
            });
            continue;
        }

        events.push({
            id: t.id,
            title: t.taskName,
            color: color ?? "rgba(0,0,0,0.57)",
            start,
            end: end.isBefore(start) ? start : end,
            resourceId: t.id
        });
    }

    return {resources, events, milestones, checkpoints};
};

const calcFractionalOrder = (prev?: number, next?: number) => {
    if (prev != null && next != null) return (prev + next) / 2;
    if (prev != null) return prev + 1;
    if (next != null) return next - 1;
    return 0;
};

type ResourceLaneMovePayload = {
    // matches schedulant ResourceLaneMoveMountArg shape used by resourceLaneMove callback
    draggedResourceApi: { getId: () => string };
    targetResourceApi: { getId: () => string };
    position: "child" | "before" | "after";
};

// 伪造图例数据已移除：图例由用户配置的 valueColorMap 动态生成

export const ProjectDetail: React.FC = () => {
    const {message, modal} = App.useApp();

    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const projectId = id ?? "";

    const colorRenderStorageKey = useMemo(() => {
        // 按项目维度隔离，避免不同项目互相污染
        return projectId ? `demeter:project:${projectId}:taskColorRenderAttributeName` : null;
    }, [projectId]);

    const visibleColumnsStorageKey = useMemo(() => {
        return projectId ? `demeter:project:${projectId}:ganttVisibleColumns` : null;
    }, [projectId]);

    const {project, loading: projectLoading, error} = useProjectById(projectId);

    const {data: tasks, loading: tasksLoading, refetch: refetchTasks} = useTasks(projectId, Boolean(projectId));
    const {update: updateTask} = useUpdateTask();
    const {reorder: reorderTasks} = useReorderTasks();
    const {remove: deleteTask, loading: deleteTaskLoading} = useDeleteTask();

    const {data: attributeConfigs, loading: attributeConfigsLoading} = useTaskAttributeConfigs(projectId, Boolean(projectId));

    const [colorRenderAttributeName, setColorRenderAttributeName] = useState<string | null>(null);

    // 列配置状态（title 必选；以 key 数组存储，便于支持动态列）
    const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>([RESOURCE_COLUMN_TITLE_KEY]);

    // 根据 task 字段 + 自定义字段配置，生成统一的“可选列”列表
    const availableColumns = useMemo<AvailableColumn[]>(() => {
        const cols: AvailableColumn[] = [
            {key: RESOURCE_COLUMN_TITLE_KEY, label: "任务/团队", locked: true, defaultVisible: true},
            {key: "order", label: "排序", defaultVisible: false},
            {key: "taskType", label: "类型", defaultVisible: false},
            {key: "startDateTime", label: "开始时间", defaultVisible: false},
            {key: "endDateTime", label: "结束时间", defaultVisible: false},
            // parentId 默认不展示，但保留为可选项（便于排查/调试）
            {key: "parentId", label: "父级ID", defaultVisible: false},
        ];

        // 自定义字段：用 ca.<attributeName> 做 key
        const configs = attributeConfigs
            .filter((c) => c.attributeName)
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        for (const c of configs) {
            cols.push({
                key: `${CUSTOM_ATTRIBUTE_PREFIX}${c.attributeName}`,
                label: c.attributeLabel || c.attributeName,
                defaultVisible: false,
            });
        }

        return cols;
    }, [attributeConfigs]);

    const setSelectedColumnKeysAndPersist = useCallback((updater: string[] | ((prev: string[]) => string[])) => {
        setSelectedColumnKeys((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            const normalized = ensureTitleSelected(next);

            if (visibleColumnsStorageKey) {
                try {
                    localStorage.setItem(visibleColumnsStorageKey, JSON.stringify(normalized));
                } catch {
                    // ignore
                }
            }

            return normalized;
        });
    }, [visibleColumnsStorageKey]);

    // 清理无效列 key（比如自定义字段被删了）
    useEffect(() => {
        const allowed = new Set(availableColumns.map((c) => c.key));
        setSelectedColumnKeysAndPersist((prev) => prev.filter((k) => allowed.has(k)));
    }, [availableColumns, setSelectedColumnKeysAndPersist]);

    // 初次进入：从 localStorage 读取用户上次选择的列
    useEffect(() => {
        if (!visibleColumnsStorageKey) return;
        try {
            const raw = localStorage.getItem(visibleColumnsStorageKey);
            if (!raw) {
                setSelectedColumnKeys([RESOURCE_COLUMN_TITLE_KEY]);
                return;
            }
            const parsed = JSON.parse(raw) as unknown;
            if (!Array.isArray(parsed)) {
                setSelectedColumnKeys([RESOURCE_COLUMN_TITLE_KEY]);
                return;
            }
            const keys = parsed.filter((k): k is string => typeof k === "string");
            setSelectedColumnKeys(ensureTitleSelected(keys));
        } catch {
            // ignore
        }
    }, [visibleColumnsStorageKey]);

    const setColorRenderAttributeNameAndPersist = useCallback((name: string | null) => {
        setColorRenderAttributeName(name);
        if (!colorRenderStorageKey) return;
        try {
            if (name) {
                localStorage.setItem(colorRenderStorageKey, name);
            } else {
                localStorage.removeItem(colorRenderStorageKey);
            }
        } catch {
            // ignore
        }
    }, [colorRenderStorageKey]);

    // 初次进入：从 localStorage 读取用户上次选择
    // 注意：不要在 attributeConfigs 还没加载时就校验并回退，否则会把刚读出来的值清空
    useEffect(() => {
        if (!colorRenderStorageKey) return;
        try {
            const raw = localStorage.getItem(colorRenderStorageKey);
            const v = (raw ?? "").trim();
            // 初始化只设置 state，不额外触发写回（key 本身就来自 localStorage）
            setColorRenderAttributeName(v ? v : null);
        } catch {
            // ignore (Safari private mode / storage disabled)
        }
        // 只需在 key 变化时执行一次
    }, [colorRenderStorageKey]);

    // 当用户删除/变更字段类型导致当前选择不可用时，自动回退
    useEffect(() => {
        if (!colorRenderAttributeName) return;
        // configs 尚在加载/未完成拉取时，不做回退判定，避免“刷新后立刻清空”
        if (attributeConfigsLoading) return;
        const cfg = attributeConfigs.find((c) => c.attributeName === colorRenderAttributeName);
        if (!cfg || !(cfg.attributeType === "select" || cfg.attributeType === "user")) {
            // 明确失效时才同步清理 localStorage
            setColorRenderAttributeNameAndPersist(null);
        }
    }, [attributeConfigs, attributeConfigsLoading, colorRenderAttributeName, setColorRenderAttributeNameAndPersist]);

    const activeColorConfig = useMemo(() => {
        if (!colorRenderAttributeName) return null;
        const cfg = attributeConfigs.find((c) => c.attributeName === colorRenderAttributeName);
        if (!cfg) return null;
        if (!(cfg.attributeType === "select" || cfg.attributeType === "user")) return null;
        return cfg;
    }, [attributeConfigs, colorRenderAttributeName]);

    const activeColorMap = useMemo(() => {
        if (!activeColorConfig) return null;
        return buildColorMap(activeColorConfig.valueColorMap);
    }, [activeColorConfig]);

    const activeOptionLabelMap = useMemo(() => {
        if (!activeColorConfig) return null;
        return buildOptionLabelMap(activeColorConfig.attributeType, activeColorConfig.options);
    }, [activeColorConfig]);

    const legendItems = useMemo<LegendItem[]>(() => {
        if (!activeColorConfig || !activeColorMap) return [];

        const rows = normalizeColorMapToRows(activeColorConfig.valueColorMap);
        // 稳定顺序：优先按 options 的顺序，其次用 rows 顺序
        const optionOrder: string[] = [];
        if (activeOptionLabelMap) {
            for (const key of activeOptionLabelMap.keys()) optionOrder.push(key);
        }
        const orderIndex = new Map(optionOrder.map((k, i) => [k, i] as const));

        return rows
            .slice()
            .sort((a, b) => {
                const ai = orderIndex.get(a.value);
                const bi = orderIndex.get(b.value);
                if (ai != null && bi != null) return ai - bi;
                if (ai != null) return -1;
                if (bi != null) return 1;
                return a.value.localeCompare(b.value);
            })
            .map((r) => {
                const label = activeOptionLabelMap?.get(r.value) ?? r.value;
                return {color: r.color, label};
            });
    }, [activeColorConfig, activeColorMap, activeOptionLabelMap]);

    const parentTaskOptions = useMemo(
        () =>
            tasks.map((t) => ({
                value: t.id,
                label: t.taskName
            })),
        [tasks]
    );

    const [taskAttributeDrawerOpen, setTaskAttributeDrawerOpen] = useState(false);
    const [createTaskDrawerOpen, setCreateTaskDrawerOpen] = useState(false);
    const [createTaskDefaultParentId, setCreateTaskDefaultParentId] = useState<string | undefined>(undefined);

    const [editTaskDrawerOpen, setEditTaskDrawerOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    const editingTask = useMemo(() => {
        if (!editingTaskId) return null;
        return tasks.find((t) => t.id === editingTaskId) ?? null;
    }, [editingTaskId, tasks]);

    // 合并甘特图数据状态，避免多次重渲染
    const [ganttData, setGanttData] = useState<{
        events: Event[];
        resources: Resource[];
        milestones: Milestone[];
        checkpoints: Checkpoint[];
    }>({
        events: [],
        resources: [],
        milestones: [],
        checkpoints: []
    });

    // 甘特图时间范围状态
    const [ganttStartDate, setGanttStartDate] = useState<dayjs.Dayjs | null>(null);
    const [ganttEndDate, setGanttEndDate] = useState<dayjs.Dayjs | null>(null);

    // 视图类型状态
    const [viewType, setViewType] = useState<ViewType>("Day");

    // 列配置状态
    // 已废弃，改用 selectedColumnKeys
    // const [visibleColumns, setVisibleColumns] = useState({
    //     title: true,
    //     order: false,
    //     parentId: false
    // });


    // lineHeight 配置
    const [lineHeightMode, setLineHeightMode] = useState<'small' | 'medium' | 'large' | 'custom'>('medium');
    const [customLineHeight, setCustomLineHeight] = useState(40);

    // slotMinWidth 配置
    const [slotMinWidthMode, setSlotMinWidthMode] = useState<'small' | 'medium' | 'large' | 'custom'>('medium');
    const [customSlotMinWidth, setCustomSlotMinWidth] = useState(50);

    // 预设尺寸映射
    const lineHeightPresets = {
        small: 30,
        medium: 40,
        large: 50
    };

    const slotMinWidthPresets = {
        small: 40,
        medium: 50,
        large: 60
    };

    // 计算实际使用的值
    const actualLineHeight = lineHeightMode === 'custom' ? customLineHeight : lineHeightPresets[lineHeightMode];
    const actualSlotMinWidth = slotMinWidthMode === 'custom' ? customSlotMinWidth : slotMinWidthPresets[slotMinWidthMode];

    // 动态高度计算 - 使用 refs
    const cardHeaderRef = useRef<HTMLDivElement>(null);
    const legendRef = useRef<HTMLDivElement>(null);
    const projectInfoRef = useRef<HTMLDivElement>(null);

    // 使用自定义 Hook 计算动态高度
    const {height: schedulantHeight, containerRef} = useSchedulantHeight(cardHeaderRef, legendRef);

    // 当项目数据加载完成后，初始化甘特图时间范围
    useEffect(() => {
        if (!project) return;
        setGanttStartDate(dayjs(project.startDateTime));
        setGanttEndDate(project.endDateTime ? dayjs(project.endDateTime) : dayjs(project.startDateTime).add(3, "month"));
    }, [project]);

    // 当 tasks 加载/刷新时，用真实数据驱动甘特图
    useEffect(() => {
        const {resources, events, milestones, checkpoints} = tasksToSchedulantModels(
            tasks,
            colorRenderAttributeName,
            activeColorMap,
            attributeConfigs
        );
        setGanttData({resources, events, milestones, checkpoints});
    }, [tasks, colorRenderAttributeName, activeColorMap, attributeConfigs]);

    // 注意：Hook 必须在任何 early-return 之前调用（lint: rules-of-hooks）
    // 根据配置生成显示的列
    const resourceAreaColumns = useMemo(() => {
        const selected = new Set(ensureTitleSelected(selectedColumnKeys));
        const columns = availableColumns
            .filter((c) => selected.has(c.key))
            .map((c) => {
                const field = getDisplayFieldKey(c.key);
                return {
                    field,
                    headerContent: c.label,
                };
            });

        return columns as unknown as ResourceAreaColumn[];
    }, [availableColumns, selectedColumnKeys]);

    // 同步把列值铺到 resource.extendedProps 上，让 schedulant 能通过 field 读取
    useEffect(() => {
        if (!selectedColumnKeys.length) return;
        const selected = ensureTitleSelected(selectedColumnKeys);
        const keysToProject = selected.filter((k) => k !== RESOURCE_COLUMN_TITLE_KEY);
        if (!keysToProject.length) return;

        setGanttData((prev) => {
            if (!prev.resources.length) return prev;

            const nextResources = prev.resources.map((r) => {
                const current = (r.extendedProps ?? {}) as Record<string, unknown>;
                const nextExtendedProps: Record<string, unknown> = {...current};

                for (const k of keysToProject) {
                    if (k in nextExtendedProps) continue;
                    nextExtendedProps[k] = normalizeExtendedPropValue(current[k]);
                }

                // 保持 order 可读
                nextExtendedProps.order = nextExtendedProps.order ?? current.order;

                return {
                    ...r,
                    extendedProps: nextExtendedProps,
                };
            });

            return {...prev, resources: nextResources};
        });
    }, [selectedColumnKeys]);

    const handleBack = () => {
        navigate("/home/project-management");
    };

    // 向前移动时间范围（向左）
    const handleShiftLeft = () => {
        if (!ganttStartDate || !ganttEndDate) return;
        const unit = viewUnitMap[viewType];
        const duration = ganttEndDate.diff(ganttStartDate, unit as any);
        setGanttStartDate(ganttStartDate.subtract(duration, unit as any));
        setGanttEndDate(ganttEndDate.subtract(duration, unit as any));
    };

    // 向后移动时间范围（向右）
    const handleShiftRight = () => {
        if (!ganttStartDate || !ganttEndDate) return;
        const unit = viewUnitMap[viewType];
        const duration = ganttEndDate.diff(ganttStartDate, unit as any);
        setGanttStartDate(ganttStartDate.add(duration, unit as any));
        setGanttEndDate(ganttEndDate.add(duration, unit as any));
    };

    const handleEventResize = (eventResizeMountArg: EventResizeMountArg, field: "start" | "end") => {
        const {date, eventApi} = eventResizeMountArg;
        const targetId = eventApi.getId();
        setGanttData(prev => {
            const index = prev.events.findIndex(e => e.id === targetId);
            if (index === -1) return prev;
            const newEvents = [...prev.events];
            newEvents[index] = {...prev.events[index], [field]: date};
            return {...prev, events: newEvents};
        });

        // persist to backend (best-effort)
        void (async () => {
            try {
                await updateTask(projectId, targetId, {
                    [field === "start" ? "startDateTime" : "endDateTime"]: toNaiveDateTimeString(date)
                });
                await refetchTasks();
            } catch {
                // rollback by re-fetching canonical server state
                await refetchTasks();
            }
        })();
    };

    // 加载状态（需要 project 和 tasks 都加载结束才结束）
    const isLoading = Boolean(projectId) && (projectLoading || tasksLoading);
    if (isLoading) {
        return (
            <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>
                <Spin size="large">
                    <div style={{padding: "50px"}}/>
                </Spin>
            </div>
        );
    }

    // 错误状态
    if (error || !project) {
        return (
            <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>
                <Result
                    status="404"
                    title="项目不存在"
                    subTitle="抱歉，您访问的项目不存在或已被删除。"
                    extra={
                        <Space>
                            <Button type="primary" onClick={handleBack}>
                                返回项目列表
                            </Button>
                        </Space>
                    }
                />
            </div>
        );
    }

    const startDate = dayjs(project.startDateTime);
    const endDate = project.endDateTime ? dayjs(project.endDateTime) : startDate.add(3, "month");

    // 使用甘特图自定义时间范围，如果未设置则使用项目默认时间
    const displayStartDate = ganttStartDate || startDate;
    const displayEndDate = ganttEndDate || endDate;

    return (
        <div ref={containerRef} className="project-detail">
            <Card
                className="gantt-chart-card"
                title={
                    <div ref={cardHeaderRef}>
                        <GanttToolbar
                            projectName={project.projectName}
                            viewType={viewType}
                            ganttStartDate={ganttStartDate}
                            ganttEndDate={ganttEndDate}
                            onViewTypeChange={setViewType}
                            onStartDateChange={setGanttStartDate}
                            onEndDateChange={setGanttEndDate}
                            onShiftLeft={handleShiftLeft}
                            onShiftRight={handleShiftRight}
                            onJumpToToday={() => {
                                const unit = viewUnitMap[viewType];
                                const range = viewDefaultRangeMap[viewType];
                                setGanttStartDate(dayjs());
                                setGanttEndDate(dayjs().add(range, unit as any));
                            }}
                            onOpenTaskAttributeConfig={() => setTaskAttributeDrawerOpen(true)}
                            onOpenCreateTask={() => {
                                setCreateTaskDefaultParentId(undefined);
                                setCreateTaskDrawerOpen(true);
                            }}
                            onBack={handleBack}
                            lineHeightMode={lineHeightMode}
                            customLineHeight={customLineHeight}
                            slotMinWidthMode={slotMinWidthMode}
                            customSlotMinWidth={customSlotMinWidth}
                            actualLineHeight={actualLineHeight}
                            actualSlotMinWidth={actualSlotMinWidth}
                            availableColumns={availableColumns}
                            selectedColumnKeys={selectedColumnKeys}
                            onSelectedColumnKeysChange={setSelectedColumnKeysAndPersist}
                            onLineHeightModeChange={setLineHeightMode}
                            onCustomLineHeightChange={setCustomLineHeight}
                            onSlotMinWidthModeChange={setSlotMinWidthMode}
                            onCustomSlotMinWidthChange={setCustomSlotMinWidth}
                            attributeConfigs={attributeConfigs}
                            colorRenderAttributeName={colorRenderAttributeName}
                            onColorRenderAttributeNameChange={setColorRenderAttributeNameAndPersist}
                        />
                    </div>
                }>
                <div className="schedulant-container">
                    <div style={{position: "relative"}}>
                        <Schedulant
                            start={displayStartDate}
                            end={displayEndDate}
                            editable={true}
                            selectable={true}
                            lineHeight={actualLineHeight}
                            slotMinWidth={actualSlotMinWidth}
                            schedulantViewType={viewType}
                            schedulantMaxHeight={schedulantHeight}
                            resources={ganttData.resources}
                            events={ganttData.events}
                            checkpoints={ganttData.checkpoints}
                            milestones={ganttData.milestones}
                            dragHintColor="rgb(66, 133, 244, 0.08)"
                            selectionColor="rgba(66, 133, 244, 0.08)"
                            resourceAreaWidth={"20%"}
                            resourceAreaColumns={resourceAreaColumns}
                            milestoneMove={(milestoneMoveMountArg: MilestoneMoveMountArg) => {
                                const {date, milestoneApi} = milestoneMoveMountArg;
                                const targetId = milestoneApi.getId();
                                setGanttData(prev => {
                                    const index = prev.milestones.findIndex(m => m.id === targetId);
                                    if (index === -1) return prev;
                                    const newMilestones = [...prev.milestones];
                                    newMilestones[index] = {...prev.milestones[index], time: date};
                                    return {...prev, milestones: newMilestones};
                                });

                                void (async () => {
                                    try {
                                        // milestone uses startDateTime; keep end aligned too
                                        const dt = toNaiveDateTimeString(date);
                                        await updateTask(projectId, targetId, {
                                            startDateTime: dt,
                                            endDateTime: dt
                                        });
                                        await refetchTasks();
                                    } catch {
                                        await refetchTasks();
                                    }
                                })();
                            }}
                            checkpointMove={(checkpointMoveMountArg: CheckpointMoveMountArg) => {
                                const {date, checkpointApi} = checkpointMoveMountArg;
                                const targetId = checkpointApi.getId();
                                setGanttData(prev => {
                                    const index = prev.checkpoints.findIndex(c => c.id === targetId);
                                    if (index === -1) return prev;
                                    const newCheckpoints = [...prev.checkpoints];
                                    newCheckpoints[index] = {...prev.checkpoints[index], time: date};
                                    return {...prev, checkpoints: newCheckpoints};
                                });

                                void (async () => {
                                    try {
                                        const dt = toNaiveDateTimeString(date);
                                        await updateTask(projectId, targetId, {
                                            startDateTime: dt,
                                            endDateTime: dt
                                        });
                                        await refetchTasks();
                                    } catch {
                                        await refetchTasks();
                                    }
                                })();
                            }}
                            eventMove={(eventMoveMountArg: EventMoveMountArg) => {
                                const {startDate, endDate, eventApi} = eventMoveMountArg;
                                const targetId = eventApi.getId();
                                setGanttData(prev => {
                                    const index = prev.events.findIndex(e => e.id === targetId);
                                    if (index === -1) return prev;
                                    const newEvents = [...prev.events];
                                    newEvents[index] = {...prev.events[index], start: startDate, end: endDate};
                                    return {...prev, events: newEvents};
                                });

                                void (async () => {
                                    try {
                                        await updateTask(projectId, targetId, {
                                            startDateTime: toNaiveDateTimeString(startDate),
                                            endDateTime: toNaiveDateTimeString(endDate)
                                        });
                                        await refetchTasks();
                                    } catch {
                                        await refetchTasks();
                                    }
                                })();
                            }}
                            eventResizeStart={(eventResizeMountArg: EventResizeMountArg) => handleEventResize(eventResizeMountArg, "start")}
                            eventResizeEnd={(eventResizeMountArg: EventResizeMountArg) => handleEventResize(eventResizeMountArg, "end")}
                            resourceLaneMove={(resourceLaneMoveArg: ResourceLaneMovePayload) => {
                                const {draggedResourceApi, targetResourceApi, position} = resourceLaneMoveArg;
                                const draggedId = draggedResourceApi.getId();
                                const targetId = targetResourceApi.getId();

                                // compute new parentId + a best-effort order (fractional order to allow inserts)
                                const draggedTask = tasks.find((t) => t.id === draggedId);
                                const targetTask = tasks.find((t) => t.id === targetId);
                                if (!draggedTask || !targetTask) return;

                                const oldParentId = draggedTask.parentId ?? null;
                                const newParentId =
                                    position === "child" ? targetTask.id : (targetTask.parentId ?? null);

                                const siblings = tasks
                                    .filter((t) => (t.parentId ?? null) === newParentId && t.id !== draggedId)
                                    .slice()
                                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

                                const targetIndex = siblings.findIndex((t) => t.id === targetId);

                                let newOrder: number | null = draggedTask.order ?? null;
                                if (position === "before") {
                                    const next = targetIndex >= 0 ? siblings[targetIndex] : undefined;
                                    const prev = targetIndex > 0 ? siblings[targetIndex - 1] : undefined;
                                    newOrder = calcFractionalOrder(prev?.order ?? undefined, next?.order ?? undefined);
                                } else if (position === "after") {
                                    const prev = targetIndex >= 0 ? siblings[targetIndex] : siblings[siblings.length - 1];
                                    const next =
                                        targetIndex >= 0 && targetIndex + 1 < siblings.length
                                            ? siblings[targetIndex + 1]
                                            : undefined;
                                    newOrder = calcFractionalOrder(prev?.order ?? undefined, next?.order ?? undefined);
                                } else {
                                    // child: append to end of new parent's children
                                    const last = siblings[siblings.length - 1];
                                    newOrder = (last?.order ?? 0) + 1;
                                }

                                // optimistic UI update
                                setGanttData(prev => {
                                    const newResources = [...prev.resources];
                                    const draggedIndex = newResources.findIndex((r) => r.id === draggedId);
                                    if (draggedIndex === -1) return prev;

                                    newResources[draggedIndex] = {
                                        ...newResources[draggedIndex],
                                        parentId: newParentId ?? undefined,
                                        extendedProps: {
                                            ...(newResources[draggedIndex].extendedProps as Record<string, unknown>),
                                            order: newOrder ?? undefined
                                        }
                                    };

                                    return {...prev, resources: newResources};
                                });

                                void (async () => {
                                    try {
                                        await updateTask(projectId, draggedId, {
                                            parentId: newParentId,
                                            order: newOrder
                                        });

                                        // integer normalize: reorder both source siblings and destination siblings
                                        await reorderTasks(projectId, {parentId: oldParentId});
                                        if (newParentId !== oldParentId) {
                                            await reorderTasks(projectId, {parentId: newParentId});
                                        }

                                        await refetchTasks();
                                    } catch {
                                        await refetchTasks();
                                    }
                                })();
                            }}
                            enableResourceLaneContextMenu={true}
                            resourceLaneContextMenuItems={[
                                {
                                    key: "create-subtask",
                                    label: "创建子任务",
                                },
                                {
                                    key: "edit-task",
                                    label: "编辑任务",
                                },
                                {
                                    key: "delete-task",
                                    label: "删除任务",
                                }
                            ]}
                            resourceLaneContextMenuClick={(menuArg) => {
                                const {key, resourceApi} = menuArg;

                                const taskId = resourceApi.getId();
                                const taskName = resourceApi.getTitle();

                                // schedulant getParentId() returns an Option-like object
                                const parentIdOption = resourceApi.getParentId();
                                const parentId = parentIdOption?.isDefined?.() ? parentIdOption.get() : null;

                                switch (key) {
                                    case "create-subtask": {
                                        setCreateTaskDefaultParentId(taskId);
                                        setCreateTaskDrawerOpen(true);
                                        return;
                                    }
                                    case "edit-task": {
                                        const fullTask = tasks.find((t) => t.id === taskId);
                                        if (!fullTask) {
                                            void refetchTasks();
                                            return;
                                        }

                                        setEditingTaskId(taskId);
                                        setEditTaskDrawerOpen(true);
                                        return;
                                    }
                                    case "delete-task": {
                                        if (deleteTaskLoading) return;

                                        modal.confirm({
                                            title: "确认删除任务？",
                                            content: `将删除「${taskName}」以及其所有子任务。`,
                                            okText: "删除",
                                            okButtonProps: {danger: true},
                                            cancelText: "取消",
                                            onOk: async () => {
                                                try {
                                                    await deleteTask(projectId, taskId);
                                                    await reorderTasks(projectId, {parentId});
                                                    await refetchTasks();
                                                    message.success("删除成功");
                                                } catch (e: unknown) {
                                                    const err = e as { message?: string };
                                                    message.error(err?.message ?? "删除失败");
                                                    await refetchTasks();
                                                    throw e;
                                                }
                                            }
                                        });

                                        return;
                                    }
                                }
                            }}
                        />

                    </div>

                    {/* 图例 - 用真实的 valueColorMap 生成 */}
                    <GanttLegend ref={legendRef} items={legendItems}/>

                    {/* 项目信息 */}
                    <ProjectInfo
                        ref={projectInfoRef}
                        startDateTime={project.startDateTime}
                        endDateTime={project.endDateTime}
                    />
                </div>
            </Card>

            <TaskAttributeConfigDrawer
                open={taskAttributeDrawerOpen}
                projectId={project.id}
                onClose={() => setTaskAttributeDrawerOpen(false)}
            />

            <EditTaskDrawer
                open={editTaskDrawerOpen}
                projectId={project.id}
                task={editingTask}
                parentOptions={parentTaskOptions}
                onClose={() => {
                    setEditTaskDrawerOpen(false);
                    setEditingTaskId(null);
                }}
                onUpdated={async () => {
                    await refetchTasks();
                }}
            />

            <CreateTaskDrawer
                open={createTaskDrawerOpen}
                projectId={project.id}
                parentOptions={parentTaskOptions}
                defaultParentId={createTaskDefaultParentId}
                defaultRange={{
                    start: displayStartDate.startOf("day"),
                    end: displayStartDate.startOf("day").add(7, "day")
                }}
                onClose={() => setCreateTaskDrawerOpen(false)}
                onCreated={async () => {
                    await refetchTasks();
                }}
            />
        </div>
    );
};

const jsonValueToString = (v: JsonValue | undefined): string | null => {
    if (v == null) return null;
    if (typeof v === "string") {
        const s = v.trim();
        return s ? s : null;
    }
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    return null;
};

type DisplayValueMap = ReadonlyMap<string, string>;

const buildOptionLabelMap = (attributeType: string, options: JsonValue | null): ReadonlyMap<string, string> => {
    const rows = attributeType === "user" ? normalizeUserOptionsToRows(options) : normalizeOptionsToRows(options);
    const pairs: Array<readonly [string, string]> = [];
    for (const r of rows) {
        if (attributeType === "user") {
            const v = r.value;
            if (typeof v === "string") continue;
            pairs.push([v.value, r.label]);
        } else {
            if (typeof r.value !== "string") continue;
            pairs.push([r.value, r.label]);
        }
    }
    return new Map(pairs);
};

import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {App, Card, Spin} from "antd";
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
    type ResourceLaneMoveMountArg,
    Schedulant
} from "schedulant";
import {
    useProjectById,
    useProjectTaskAttributeConfigs,
    useProjectTasks,
    useUpdateProjectTask,
    useReorderProjectTasks,
    useDeleteProjectTask,
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
    TaskPreviewDrawer,
    viewDefaultRangeMap,
    type ViewType,
    viewUnitMap
} from "./components";
import {normalizeColorMapToRows} from "./components/task-attribute-config-drawer/serializers.ts";
import "schedulant/dist/schedulant.css";
import "./project-detail.scss";
import {
    buildColorMap,
    buildOptionLabelMap,
    calcFractionalOrder,
    CUSTOM_ATTRIBUTE_PREFIX,
    ensureTitleSelected,
    getDisplayFieldKey,
    normalizeExtendedPropValue,
    RESOURCE_COLUMN_TITLE_KEY,
    tasksToSchedulantModels
} from "./utils.ts";
import {shiftRangeByViewStep} from "./components/gantt-date-navigation.ts";

dayjs.extend(isSameOrBefore);
dayjs.extend(quarterOfYear);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);

type AvailableColumn = {
    key: string;
    label: string;
    locked?: boolean;
    defaultVisible?: boolean;
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

    const {project, loading: projectLoading} = useProjectById(projectId);

    const {data: tasks, loading: tasksLoading, refetch: refetchTasks} = useProjectTasks(projectId, Boolean(projectId));
    const {update: updateTask} = useUpdateProjectTask();
    const {reorder: reorderTasks} = useReorderProjectTasks();
    const {remove: deleteTask, loading: deleteTaskLoading} = useDeleteProjectTask();

    const {
        data: attributeConfigs,
        loading: attributeConfigsLoading
    } = useProjectTaskAttributeConfigs(projectId, Boolean(projectId));

    // 初始化时从 localStorage 读取颜色渲染属性名
    const [colorRenderAttributeName, setColorRenderAttributeName] = useState<string | null>(() => {
        if (!colorRenderStorageKey) return null;
        try {
            const raw = localStorage.getItem(colorRenderStorageKey);
            const v = (raw ?? "").trim();
            return v || null;
        } catch {
            return null;
        }
    });

    // 列配置状态（title 必选；以 key 数组存储，便于支持动态列）
    // 初始化时从 localStorage 读取
    const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(() => {
        if (!visibleColumnsStorageKey) return [RESOURCE_COLUMN_TITLE_KEY];
        try {
            const raw = localStorage.getItem(visibleColumnsStorageKey);
            if (!raw) return [RESOURCE_COLUMN_TITLE_KEY];
            const parsed = JSON.parse(raw) as unknown;
            if (!Array.isArray(parsed)) return [RESOURCE_COLUMN_TITLE_KEY];
            const keys = parsed.filter((k): k is string => typeof k === "string");
            return ensureTitleSelected(keys);
        } catch {
            return [RESOURCE_COLUMN_TITLE_KEY];
        }
    });

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
        const filtered = selectedColumnKeys.filter((k) => allowed.has(k));
        if (filtered.length !== selectedColumnKeys.length) {
            // 使用 setTimeout 确保在下一个事件循环中更新状态
            const timeoutId = setTimeout(() => {
                setSelectedColumnKeysAndPersist(filtered);
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [availableColumns, selectedColumnKeys, setSelectedColumnKeysAndPersist]);

    // 删除重复的 useEffect（因为已经在 useState 初始化时从 localStorage 读取）

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

    // 当用户删除/变更字段类型导致当前选择不可用时，自动回退
    useEffect(() => {
        if (!colorRenderAttributeName) return;
        // configs 尚在加载/未完成拉取时，不做回退判定，避免“刷新后立刻清空”
        if (attributeConfigsLoading) return;
        const cfg = attributeConfigs.find((c) => c.attributeName === colorRenderAttributeName);
        if (!cfg || !(cfg.attributeType === "select" || cfg.attributeType === "user")) {
            // 使用 setTimeout 确保在下一个事件循环中更新状态
            const timeoutId = setTimeout(() => {
                setColorRenderAttributeNameAndPersist(null);
            }, 0);
            return () => clearTimeout(timeoutId);
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
    const [createTaskDefaultOrder, setCreateTaskDefaultOrder] = useState<number>(1.0);
    const [createTaskDefaultType, setCreateTaskDefaultType] = useState<number>(1); // 1 = TaskType.DEFAULT

    const [editTaskDrawerOpen, setEditTaskDrawerOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    const [previewTaskDrawerOpen, setPreviewTaskDrawerOpen] = useState(false);
    const [previewingTaskId, setPreviewingTaskId] = useState<string | null>(null);

    const previewingTask = useMemo(() => {
        if (!previewingTaskId) return null;
        return tasks.find((t) => t.id === previewingTaskId) ?? null;
    }, [previewingTaskId, tasks]);

    const parentLabelMap = useMemo(() => {
        const pairs = tasks.map((t) => [t.id, t.taskName] as const);
        return new Map(pairs);
    }, [tasks]);

    const editingTask = useMemo(() => {
        if (!editingTaskId) return null;
        return tasks.find((t) => t.id === editingTaskId) ?? null;
    }, [editingTaskId, tasks]);

    // 乐观更新的临时数据（用于拖拽等交互）
    const [optimisticGanttData, setOptimisticGanttData] = useState<{
        events: Event[];
        resources: Resource[];
        milestones: Milestone[];
        checkpoints: Checkpoint[];
    } | null>(null);

    // 甘特图时间范围状态
    const today = dayjs();
    const [ganttStartDate, setGanttStartDate] = useState<dayjs.Dayjs>(today.subtract(1, "week"));
    const [ganttEndDate, setGanttEndDate] = useState<dayjs.Dayjs>(today.add(3, "week"));

    // 视图类型状态
    const [viewType, setViewType] = useState<ViewType>("Day");

    // lineHeight 配置
    const [lineHeightMode, setLineHeightMode] = useState<'small' | 'medium' | 'large' | 'custom'>('medium');
    const [customLineHeight, setCustomLineHeight] = useState(40);

    // slotMinWidth 配置
    const [slotMinWidthMode, setSlotMinWidthMode] = useState<'small' | 'medium' | 'large' | 'custom'>('medium');
    const [customSlotMinWidth, setCustomSlotMinWidth] = useState(50);

    // 预设行高
    const lineHeightPresets = {
        small: 30,
        medium: 40,
        large: 50
    };

    // 预设时间槽最小宽度
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

    // 当 tasks 加载/刷新时，用真实数据驱动甘特图
    const ganttDataBase = useMemo(() => {
        const {resources, events, milestones, checkpoints} = tasksToSchedulantModels(
            tasks,
            colorRenderAttributeName,
            activeColorMap,
            attributeConfigs
        );
        return {resources, events, milestones, checkpoints};
    }, [tasks, colorRenderAttributeName, activeColorMap, attributeConfigs]);

    // 同步把列值铺到 resource.extendedProps 上，让 schedulant 能通过 field 读取
    const ganttData = useMemo(() => {
        // 如果有乐观更新数据，优先使用
        if (optimisticGanttData) {
            return optimisticGanttData;
        }

        const selected = ensureTitleSelected(selectedColumnKeys);
        const keysToProject = selected.filter((k) => k !== RESOURCE_COLUMN_TITLE_KEY);

        if (!keysToProject.length || !ganttDataBase.resources.length) {
            return ganttDataBase;
        }

        const nextResources = ganttDataBase.resources.map((r) => {
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

        return {...ganttDataBase, resources: nextResources};
    }, [ganttDataBase, selectedColumnKeys, optimisticGanttData]);

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

    // 向前移动时间范围（向左）
    const handleShiftLeft = () => {
        if (!ganttStartDate || !ganttEndDate) return;
        const next = shiftRangeByViewStep(ganttStartDate, ganttEndDate, viewType, -1);
        setGanttStartDate(next.start);
        setGanttEndDate(next.end);
    };

    // 向后移动时间范围（向右）
    const handleShiftRight = () => {
        if (!ganttStartDate || !ganttEndDate) return;
        const next = shiftRangeByViewStep(ganttStartDate, ganttEndDate, viewType, 1);
        setGanttStartDate(next.start);
        setGanttEndDate(next.end);
    };

    const handleEventResize = (eventResizeMountArg: EventResizeMountArg, field: "start" | "end") => {
        const {date, eventApi} = eventResizeMountArg;
        const targetId = eventApi.getId();
        // persist to backend (best-effort)
        void (async () => {
            try {
                const parentId = eventApi.getResourceApi().getParentId();
                const payload: Record<string, string> = {
                    [field === "start" ? "startDateTime" : "endDateTime"]: date.format("YYYY-MM-DDTHH:mm:ss")
                };
                if (parentId.isDefined()) {
                    payload["parentId"] = parentId.get();
                }
                await updateTask(projectId, targetId, payload);
                await refetchTasks();
                setOptimisticGanttData(null);
            } catch {
                // rollback by re-fetching canonical server state
                await refetchTasks();
                setOptimisticGanttData(null);
            }
        })();
    };

    return (
        <div ref={containerRef} className="project-detail">
            <Spin spinning={Boolean(projectId) && (projectLoading || tasksLoading)}>
                <Card
                    className="gantt-chart-card"
                    title={
                        <div ref={cardHeaderRef}>
                            <GanttToolbar
                                projectName={project?.projectName || ""}
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
                                    setGanttEndDate(dayjs().add(range, unit as dayjs.ManipulateType));
                                }}
                                onOpenTaskAttributeConfig={() => setTaskAttributeDrawerOpen(true)}
                                onOpenCreateTask={() => {
                                    setCreateTaskDefaultParentId(undefined);
                                    setCreateTaskDefaultType(1); // TaskType.DEFAULT
                                    // Calculate default order: max order + 1
                                    const maxOrder = tasks.length > 0
                                        ? Math.max(...tasks.map(t => t.order))
                                        : 0;
                                    setCreateTaskDefaultOrder(maxOrder + 1);
                                    setCreateTaskDrawerOpen(true);
                                }}
                                onBack={() => navigate("/home/project-management")}
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
                                start={ganttStartDate}
                                end={ganttEndDate}
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
                                    const parentId = milestoneApi.getResourceId();
                                    void (async () => {
                                        try {
                                            // milestone uses startDateTime; keep end aligned too
                                            const dt = date.format("YYYY-MM-DDTHH:mm:ss");
                                            await updateTask(projectId, targetId, {
                                                startDateTime: dt,
                                                endDateTime: dt,
                                                parentId: parentId
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
                                    const parentId = checkpointApi.getResourceId();
                                    void (async () => {
                                        try {
                                            const dt = date.format("YYYY-MM-DDTHH:mm:ss");
                                            await updateTask(projectId, targetId, {
                                                startDateTime: dt,
                                                endDateTime: dt,
                                                parentId: parentId
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
                                    const parentId = eventApi.getResourceId();
                                    void (async () => {
                                        try {
                                            await updateTask(projectId, targetId, {
                                                startDateTime: startDate.format("YYYY-MM-DDTHH:mm:ss"),
                                                endDateTime: endDate.format("YYYY-MM-DDTHH:mm:ss"),
                                                parentId: parentId
                                            });
                                            await refetchTasks();
                                        } catch {
                                            await refetchTasks();
                                        }
                                    })();
                                }}
                                eventResizeStart={(eventResizeMountArg: EventResizeMountArg) => handleEventResize(eventResizeMountArg, "start")}
                                eventResizeEnd={(eventResizeMountArg: EventResizeMountArg) => handleEventResize(eventResizeMountArg, "end")}
                                resourceLaneMove={(resourceLaneMoveArg: ResourceLaneMoveMountArg) => {
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
                                    setOptimisticGanttData(prev => {
                                        const base = prev ?? ganttData;
                                        const newResources = [...base.resources];
                                        const draggedIndex = newResources.findIndex((r) => r.id === draggedId);
                                        if (draggedIndex === -1) return base;

                                        newResources[draggedIndex] = {
                                            ...newResources[draggedIndex],
                                            parentId: newParentId ?? undefined,
                                            extendedProps: {
                                                ...(newResources[draggedIndex].extendedProps as Record<string, unknown>),
                                                order: newOrder ?? undefined
                                            }
                                        };

                                        return {...base, resources: newResources};
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
                                            setOptimisticGanttData(null); // 清除乐观更新，使用真实数据
                                        } catch {
                                            await refetchTasks();
                                            setOptimisticGanttData(null); // 清除乐观更新，恢复原始数据
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
                                        key: "create-checkpoint",
                                        label: "创建检查点 (Checkpoint)",
                                    },
                                    {
                                        key: "create-milestone",
                                        label: "创建里程碑 (Milestone)",
                                    },
                                    {
                                        key: "preview-task",
                                        label: "预览任务",
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
                                            setCreateTaskDefaultType(1); // TaskType.DEFAULT
                                            // Calculate default order for subtask: max order of siblings + 1
                                            const siblings = tasks.filter(t => t.parentId === taskId);
                                            const maxOrder = siblings.length > 0
                                                ? Math.max(...siblings.map(t => t.order))
                                                : 0;
                                            setCreateTaskDefaultOrder(maxOrder + 1);
                                            setCreateTaskDrawerOpen(true);
                                            return;
                                        }
                                        case "create-checkpoint": {
                                            setCreateTaskDefaultParentId(taskId);
                                            setCreateTaskDefaultType(3); // TaskType.CHECKPOINT
                                            // Calculate default order for checkpoint: max order of siblings + 1
                                            const siblings = tasks.filter(t => t.parentId === taskId);
                                            const maxOrder = siblings.length > 0
                                                ? Math.max(...siblings.map(t => t.order))
                                                : 0;
                                            setCreateTaskDefaultOrder(maxOrder + 1);
                                            setCreateTaskDrawerOpen(true);
                                            return;
                                        }
                                        case "create-milestone": {
                                            setCreateTaskDefaultParentId(taskId);
                                            setCreateTaskDefaultType(2); // TaskType.MILESTONE
                                            // Calculate default order for milestone: max order of siblings + 1
                                            const siblings = tasks.filter(t => t.parentId === taskId);
                                            const maxOrder = siblings.length > 0
                                                ? Math.max(...siblings.map(t => t.order))
                                                : 0;
                                            setCreateTaskDefaultOrder(maxOrder + 1);
                                            setCreateTaskDrawerOpen(true);
                                            return;
                                        }
                                        case "preview-task": {
                                            const fullTask = tasks.find((t) => t.id === taskId);
                                            if (!fullTask) {
                                                void refetchTasks();
                                                return;
                                            }
                                            setPreviewingTaskId(taskId);
                                            setPreviewTaskDrawerOpen(true);
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
                            startDateTime={project?.startDateTime || "加载中"}
                            endDateTime={project?.endDateTime}
                        />
                    </div>
                </Card>
            </Spin>

            <TaskAttributeConfigDrawer
                open={taskAttributeDrawerOpen}
                projectId={project?.id || ""}
                onClose={() => setTaskAttributeDrawerOpen(false)}
            />

            <TaskPreviewDrawer
                open={previewTaskDrawerOpen}
                task={previewingTask}
                attributeConfigs={attributeConfigs}
                attributeConfigsLoading={attributeConfigsLoading}
                parentLabelMap={parentLabelMap}
                onEdit={() => {
                    if (!previewingTaskId) return;
                    setEditingTaskId(previewingTaskId);
                    setEditTaskDrawerOpen(true);
                }}
                onClose={() => {
                    setPreviewTaskDrawerOpen(false);
                    setPreviewingTaskId(null);
                }}
            />

            <EditTaskDrawer
                open={editTaskDrawerOpen}
                projectId={project?.id || ""}
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
                projectId={project?.id || ""}
                parentOptions={parentTaskOptions}
                defaultParentId={createTaskDefaultParentId}
                defaultOrder={createTaskDefaultOrder}
                defaultRange={{
                    start: ganttStartDate.startOf("day"),
                    end: ganttEndDate.startOf("day").add(7, "day")
                }}
                defaultTaskType={createTaskDefaultType}
                onClose={() => setCreateTaskDrawerOpen(false)}
                onCreated={async () => {
                    await refetchTasks();
                }}
            />
        </div>
    );
};



import {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import type {TFunction} from "i18next";
import type {Checkpoint, Event, Milestone, Resource, ResourceAreaColumn} from "schedulant";
import dayjs from "dayjs";
import {
    type JsonValue,
    type ProjectTask,
    type ProjectTaskAttributeConfig,
    ProjectTaskType,
    TaskTypeLabelKeys,
    useProjectDetail,
    useProjectTaskAttributeConfigList,
    useProjectTaskList,
} from "@Webapp/api";
import {
    normalizeColorMapToRows,
    normalizeOptionsToRows,
    normalizeUserOptionsToRows,
} from "../components/schedulant-toolbar/components/serializers.ts";
import type {AvailableColumn, LegendItem} from "../constants.ts";

/* ------------------------------------------------------------------ */
/*  Internal helpers (moved from utils.ts)                             */
/* ------------------------------------------------------------------ */

const safeDayjs = (value: string) => {
    const d = dayjs(value);
    return d.isValid() ? d : dayjs();
};

const CUSTOM_ATTRIBUTE_PREFIX = "ca.";

type DisplayValueMap = ReadonlyMap<string, string>;
type ColorMap = ReadonlyMap<string, string>;

const jsonValueToString = (v: JsonValue | undefined): string | null => {
    if (v == null) return null;
    if (typeof v === "string") {
        const s = v.trim();
        return s ? s : null;
    }
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

const buildColorMap = (valueColorMap: JsonValue | null): ColorMap => {
    const rows = normalizeColorMapToRows(valueColorMap);
    return new Map(rows.map((r) => [r.value, r.color] as const));
};

const RESOURCE_COLUMN_TITLE_KEY = "title";

const ensureTitleSelected = (keys: readonly string[]): string[] =>
    keys.includes(RESOURCE_COLUMN_TITLE_KEY) ? [...keys] : [RESOURCE_COLUMN_TITLE_KEY, ...keys];

const normalizeExtendedPropValue = (v: unknown): string | number | boolean | null | undefined => {
    if (v == null) return v as null | undefined;
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return v;
    return null;
};

const getDisplayFieldKey = (key: string): string => {
    if (key === "taskType") return "taskTypeLabel";
    if (key.startsWith(CUSTOM_ATTRIBUTE_PREFIX)) return `${key}Label`;
    return key;
};

const buildOptionLabelMap = (
    attributeType: string,
    options: JsonValue | null,
): DisplayValueMap => {
    if (attributeType === "user") {
        const rows = normalizeUserOptionsToRows(options);
        const pairs: Array<readonly [string, string]> = [];
        for (const r of rows) {
            const v = r.value;
            if (typeof v === "string") continue;
            pairs.push([v.value, r.label]);
        }
        return new Map(pairs);
    }
    const rows = normalizeOptionsToRows(options);
    return new Map(rows.map((r) => [String(r.value), r.label] as const));
};

const tasksToSchedulantModels = (
    tasks: ProjectTask[],
    colorRenderAttributeName: string | null,
    colorMap: ColorMap | null,
    attributeConfigs: readonly ProjectTaskAttributeConfig[],
    t: TFunction,
) => {
    const configByName = new Map(attributeConfigs.map((c) => [c.attributeName, c] as const));

    const labelMaps = new Map<string, DisplayValueMap>();
    for (const c of attributeConfigs) {
        if (c.attributeName && (c.attributeType === "select" || c.attributeType === "user")) {
            labelMaps.set(c.attributeName, buildOptionLabelMap(c.attributeType, c.options));
        }
    }

    const resources: Resource[] = tasks
        .filter((task) => task.taskType !== ProjectTaskType.MILESTONE && task.taskType !== ProjectTaskType.CHECKPOINT)
        .map((task) => {
            const baseExtendedProps: Record<string, unknown> = {
                order: task.order ?? undefined,
                taskType: task.taskType,
                taskTypeLabel: t(TaskTypeLabelKeys[(task.taskType as ProjectTaskType) ?? ProjectTaskType.UNKNOWN] ?? String(task.taskType)),
                startDateTime: dayjs(task.startDateTime).format("YYYY-MM-DD"),
                endDateTime: dayjs(task.endDateTime).format("YYYY-MM-DD"),
                parentId: task.parentId ?? null,
            };

            const ca = task.customAttributes;
            if (ca && typeof ca === "object" && !Array.isArray(ca)) {
                const caObj = ca as Record<string, JsonValue>;
                for (const [k, v] of Object.entries(caObj)) {
                    const storedKey = `${CUSTOM_ATTRIBUTE_PREFIX}${k}`;
                    baseExtendedProps[storedKey] = v;

                    const lm = labelMaps.get(k);
                    if (lm) {
                        const cfg = configByName.get(k);
                        const raw = cfg?.attributeType === "user" ? toUserIdFromJson(v) : jsonValueToString(v);
                        baseExtendedProps[`${storedKey}Label`] = (raw && lm.get(raw)) ?? raw;
                    } else {
                        baseExtendedProps[`${storedKey}Label`] = jsonValueToString(v);
                    }
                }
            }

            return {
                id: task.id,
                title: task.taskName,
                parentId: task.parentId ?? undefined,
                extendedProps: baseExtendedProps,
            };
        });

    const getColorForTask = (task: ProjectTask): string | undefined => {
        if (!colorRenderAttributeName || !colorMap) return undefined;
        const attrs = task.customAttributes;
        if (!attrs || typeof attrs !== "object" || Array.isArray(attrs)) return undefined;
        const raw = (attrs as Record<string, JsonValue>)[colorRenderAttributeName];
        const value = jsonValueToString(raw);
        if (!value) return undefined;
        return colorMap.get(value);
    };

    const events: Event[] = [];
    const milestones: Milestone[] = [];
    const checkpoints: Checkpoint[] = [];

    for (const task of tasks) {
        const start = safeDayjs(task.startDateTime);
        const end = safeDayjs(task.endDateTime);
        const color = getColorForTask(task);

        if (task.taskType === ProjectTaskType.MILESTONE) {
            milestones.push({
                id: task.id,
                title: task.taskName,
                time: start,
                status: "Success",
                resourceId: task.parentId || "",
                ...(color ? {color} : {}),
            });
            continue;
        }

        if (task.taskType === ProjectTaskType.CHECKPOINT) {
            checkpoints.push({
                id: task.id,
                title: task.taskName,
                time: start,
                resourceId: task.parentId || "",
                ...(color ? {color} : {color: "green"}),
            });
            continue;
        }

        events.push({
            id: task.id,
            title: task.taskName,
            color: color ?? "rgba(0,0,0,0.57)",
            start,
            end: end.isBefore(start) ? start : end,
            resourceId: task.id,
        });
    }

    return {resources, events, milestones, checkpoints};
};

/**
 * 封装 Schedulant 组件所需的全部数据：
 * 项目/任务/属性配置的获取、颜色渲染、列配置、以及最终的 Schedulant 模型。
 */
export const useSchedulantData = (projectId: string) => {
    const {t} = useTranslation();

    // ---- 数据获取 ----
    const {project, loading: projectLoading, fetchProject} = useProjectDetail();
    const {tasks, loading: tasksLoading, fetchTasks} = useProjectTaskList();
    const {
        configs: attributeConfigs,
        loading: attributeConfigsLoading,
        fetchConfigs: fetchAttributeConfigs,
    } = useProjectTaskAttributeConfigList();

    // ---- 颜色渲染属性 ----
    const [colorRenderAttributeName, setColorRenderAttributeName] = useState<string | null>(null);

    // ---- 列选择 ----
    const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(["title"]);

    // ---- 初始拉取 ----
    useEffect(() => {
        void fetchProject(projectId);
        void fetchTasks(projectId);
        void fetchAttributeConfigs(projectId);
    }, [projectId]);

    // ---- 刷新 ----
    const refetchTasks = useCallback(() => {
        void fetchTasks(projectId);
    }, [fetchTasks, projectId]);

    const refetchAttributeConfigs = useCallback(() => {
        return fetchAttributeConfigs(projectId);
    }, [fetchAttributeConfigs, projectId]);

    // ---- 颜色渲染派生状态 ----
    const activeColorConfig = useMemo(() => {
        if (!colorRenderAttributeName) return null;
        return attributeConfigs.find((c) => c.attributeName === colorRenderAttributeName) ?? null;
    }, [colorRenderAttributeName, attributeConfigs]);

    // 如果当前选中的颜色渲染字段已没有有效的 valueColorMap，则自动清除
    useEffect(() => {
        if (!colorRenderAttributeName) return;
        const cfg = attributeConfigs.find((c) => c.attributeName === colorRenderAttributeName);
        if (!cfg) return; // 配置还未加载完毕，不做处理
        const vcm = cfg.valueColorMap;
        if (!vcm || typeof vcm !== "object" || Array.isArray(vcm) || !Object.keys(vcm).length) {
            setColorRenderAttributeName(null);
        }
    }, [colorRenderAttributeName, attributeConfigs]);

    const activeColorMap = useMemo<ColorMap | null>(() => {
        if (!activeColorConfig) return null;
        return buildColorMap(activeColorConfig.valueColorMap);
    }, [activeColorConfig]);

    const activeOptionLabelMap = useMemo<ReadonlyMap<string, string> | null>(() => {
        if (!activeColorConfig) return null;
        return buildOptionLabelMap(activeColorConfig.attributeType, activeColorConfig.options);
    }, [activeColorConfig]);

    const legendItems = useMemo<LegendItem[]>(() => {
        if (!activeColorConfig || !activeColorMap) return [];
        const rows = normalizeColorMapToRows(activeColorConfig.valueColorMap);

        const optionOrder: string[] = [];
        if (activeOptionLabelMap) {
            for (const key of activeOptionLabelMap.keys()) optionOrder.push(key);
        }
        const orderIndex = new Map(optionOrder.map((k, i) => [k, i] as const));

        return rows
            .slice()
            .sort((a, b) => {
                const ai = orderIndex.get(a.value) ?? Number.MAX_SAFE_INTEGER;
                const bi = orderIndex.get(b.value) ?? Number.MAX_SAFE_INTEGER;
                if (ai !== bi) return ai - bi;
                return a.value.localeCompare(b.value);
            })
            .map((r) => {
                const label = activeOptionLabelMap?.get(r.value) ?? r.value;
                return {color: r.color, label};
            });
    }, [activeColorConfig, activeColorMap, activeOptionLabelMap]);

    // ---- 可用列配置 ----
    const availableColumns = useMemo<AvailableColumn[]>(() => {
        const builtIn: AvailableColumn[] = [
            {key: "title", label: t("task.columnTitle"), locked: true, defaultVisible: true},
            {key: "startDateTime", label: t("task.columnStartDateTime"), defaultVisible: true},
            {key: "endDateTime", label: t("task.columnEndDateTime"), defaultVisible: true},
            {key: "taskType", label: t("task.columnTaskType"), defaultVisible: false},
        ];
        const custom: AvailableColumn[] = attributeConfigs
            .filter((c) => c.attributeName)
            .map((c) => ({
                key: `${CUSTOM_ATTRIBUTE_PREFIX}${c.attributeName}`,
                label: c.attributeLabel || c.attributeName,
                defaultVisible: false,
            }));
        return [...builtIn, ...custom];
    }, [attributeConfigs, t]);

    // ---- Schedulant 模型 ----
    const ganttDataBase = useMemo(
        () => tasksToSchedulantModels(tasks, colorRenderAttributeName, activeColorMap, attributeConfigs, t),
        [tasks, colorRenderAttributeName, activeColorMap, attributeConfigs, t],
    );

    const {resources, events, milestones, checkpoints} = useMemo(() => {
        const selected = ensureTitleSelected(selectedColumnKeys);
        const keysToProject = selected.filter((k) => k !== RESOURCE_COLUMN_TITLE_KEY);

        if (!keysToProject.length || !ganttDataBase.resources.length) {
            return ganttDataBase;
        }

        const nextResources = ganttDataBase.resources.map((r) => {
            const current = (r.extendedProps ?? {}) as Record<string, unknown>;
            const nextExtendedProps: Record<string, unknown> = {...current};

            for (const k of keysToProject) {
                if (!(k in nextExtendedProps)) nextExtendedProps[k] = normalizeExtendedPropValue(current[k]);
            }

            return {...r, extendedProps: nextExtendedProps};
        });

        return {...ganttDataBase, resources: nextResources};
    }, [ganttDataBase, selectedColumnKeys]);

    // ---- resourceAreaColumns ----
    const resourceAreaColumns = useMemo<ResourceAreaColumn[]>(() => {
        const selected = new Set(ensureTitleSelected(selectedColumnKeys));
        return availableColumns
            .filter((c) => selected.has(c.key))
            .map((c) => ({
                field: getDisplayFieldKey(c.key),
                headerContent: c.label,
            })) as unknown as ResourceAreaColumn[];
    }, [availableColumns, selectedColumnKeys]);

    // ---- 父任务选项 ----
    const parentOptions = useMemo(() => {
        return tasks.map((t) => ({value: t.id, label: t.taskName}));
    }, [tasks]);

    const parentLabelMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const t of tasks) {
            map.set(t.id, t.taskName);
        }
        return map;
    }, [tasks]);

    return {
        // 项目
        project,
        projectLoading,

        // 任务
        tasks,
        tasksLoading,
        refetchTasks,

        // 属性配置
        attributeConfigs,
        attributeConfigsLoading,
        refetchAttributeConfigs,

        // 颜色渲染
        colorRenderAttributeName,
        setColorRenderAttributeName,

        // 列配置
        availableColumns,
        selectedColumnKeys,
        setSelectedColumnKeys,

        // 图例
        legendItems,

        // Schedulant 模型
        resources,
        events,
        milestones,
        checkpoints,
        resourceAreaColumns,

        // 父任务
        parentOptions,
        parentLabelMap,
    };
};

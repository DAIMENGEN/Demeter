import { useMemo } from "react";
import type {
    Checkpoint,
    Event,
    Milestone,
    Resource,
    ResourceAreaColumn,
} from "schedulant";
import type { ProjectTaskAttributeConfig, ProjectTask } from "@Webapp/api/modules/project";
import type { GanttDataState } from "./constants";
import {
    ensureTitleSelected,
    getDisplayFieldKey,
    normalizeExtendedPropValue,
    RESOURCE_COLUMN_TITLE_KEY,
    tasksToSchedulantModels,
} from "./utils";
import type { AvailableColumn } from "./constants";
import type { ColorMap } from "./utils";

type UseGanttDataOptions = {
    tasks: ProjectTask[];
    colorRenderAttributeName: string | null;
    activeColorMap: ColorMap | null;
    attributeConfigs: ProjectTaskAttributeConfig[];
    selectedColumnKeys: string[];
    availableColumns: AvailableColumn[];
    optimisticGanttData: GanttDataState | null;
};

type UseGanttDataResult = {
    ganttData: {
        events: Event[];
        resources: Resource[];
        milestones: Milestone[];
        checkpoints: Checkpoint[];
    };
    resourceAreaColumns: ResourceAreaColumn[];
    parentTaskOptions: { value: string; label: string }[];
    parentLabelMap: Map<string, string>;
};

export const useGanttData = ({
    tasks,
    colorRenderAttributeName,
    activeColorMap,
    attributeConfigs,
    selectedColumnKeys,
    availableColumns,
    optimisticGanttData,
}: UseGanttDataOptions): UseGanttDataResult => {
    // 基础甘特图数据
    const ganttDataBase = useMemo(() => {
        const { resources, events, milestones, checkpoints } = tasksToSchedulantModels(
            tasks,
            colorRenderAttributeName,
            activeColorMap,
            attributeConfigs
        );
        return { resources, events, milestones, checkpoints };
    }, [tasks, colorRenderAttributeName, activeColorMap, attributeConfigs]);

    // 同步列值到 resource.extendedProps
    const ganttData = useMemo(() => {
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
            const nextExtendedProps: Record<string, unknown> = { ...current };

            for (const k of keysToProject) {
                if (k in nextExtendedProps) continue;
                nextExtendedProps[k] = normalizeExtendedPropValue(current[k]);
            }

            nextExtendedProps.order = nextExtendedProps.order ?? current.order;

            return {
                ...r,
                extendedProps: nextExtendedProps,
            };
        });

        return { ...ganttDataBase, resources: nextResources };
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

    // 父任务选项
    const parentTaskOptions = useMemo(
        () =>
            tasks.map((t) => ({
                value: t.id,
                label: t.taskName,
            })),
        [tasks]
    );

    // 父任务标签映射
    const parentLabelMap = useMemo(() => {
        const pairs = tasks.map((t) => [t.id, t.taskName] as const);
        return new Map(pairs);
    }, [tasks]);

    return {
        ganttData,
        resourceAreaColumns,
        parentTaskOptions,
        parentLabelMap,
    };
};

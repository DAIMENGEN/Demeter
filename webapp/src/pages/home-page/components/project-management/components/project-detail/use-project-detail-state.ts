import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import type { TaskAttributeConfig } from "@Webapp/api/modules/project";
import {
    type AvailableColumn,
    type LineHeightMode,
    type SlotMinWidthMode,
    LINE_HEIGHT_PRESETS,
    SLOT_MIN_WIDTH_PRESETS,
    DEFAULT_LINE_HEIGHT_MODE,
    DEFAULT_CUSTOM_LINE_HEIGHT,
    DEFAULT_SLOT_MIN_WIDTH_MODE,
    DEFAULT_CUSTOM_SLOT_MIN_WIDTH,
    type LegendItem,
} from "./constants";
import {
    buildColorMap,
    buildOptionLabelMap,
    CUSTOM_ATTRIBUTE_PREFIX,
    ensureTitleSelected,
    RESOURCE_COLUMN_TITLE_KEY,
    type ColorMap,
} from "./utils";
import { normalizeColorMapToRows } from "./components/task-attribute-config-drawer/serializers";
import type { ViewType } from "./components";

type UseProjectDetailStateOptions = {
    projectId: string;
    attributeConfigs: TaskAttributeConfig[];
    attributeConfigsLoading: boolean;
};

const getStorageKey = (projectId: string, suffix: string) =>
    projectId ? `demeter:project:${projectId}:${suffix}` : null;

export const useProjectDetailState = ({
    projectId,
    attributeConfigs,
    attributeConfigsLoading,
}: UseProjectDetailStateOptions) => {
    const colorRenderStorageKey = useMemo(
        () => getStorageKey(projectId, "taskColorRenderAttributeName"),
        [projectId]
    );

    const visibleColumnsStorageKey = useMemo(
        () => getStorageKey(projectId, "ganttVisibleColumns"),
        [projectId]
    );

    // 颜色渲染属性名
    const [colorRenderAttributeName, setColorRenderAttributeName] = useState<string | null>(() => {
        if (!colorRenderStorageKey) return null;
        try {
            const raw = localStorage.getItem(colorRenderStorageKey);
            return (raw ?? "").trim() || null;
        } catch {
            return null;
        }
    });

    // 列配置状态
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

    // 可选列列表
    const availableColumns = useMemo<AvailableColumn[]>(() => {
        const cols: AvailableColumn[] = [
            { key: RESOURCE_COLUMN_TITLE_KEY, label: "任务/团队", locked: true, defaultVisible: true },
            { key: "order", label: "排序", defaultVisible: false },
            { key: "taskType", label: "类型", defaultVisible: false },
            { key: "startDateTime", label: "开始时间", defaultVisible: false },
            { key: "endDateTime", label: "结束时间", defaultVisible: false },
            { key: "parentId", label: "父级ID", defaultVisible: false },
        ];

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

    const setSelectedColumnKeysAndPersist = useCallback(
        (updater: string[] | ((prev: string[]) => string[])) => {
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
        },
        [visibleColumnsStorageKey]
    );

    // 清理无效列 key
    useEffect(() => {
        const allowed = new Set(availableColumns.map((c) => c.key));
        const filtered = selectedColumnKeys.filter((k) => allowed.has(k));
        if (filtered.length !== selectedColumnKeys.length) {
            const timeoutId = setTimeout(() => {
                setSelectedColumnKeysAndPersist(filtered);
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [availableColumns, selectedColumnKeys, setSelectedColumnKeysAndPersist]);

    const setColorRenderAttributeNameAndPersist = useCallback(
        (name: string | null) => {
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
        },
        [colorRenderStorageKey]
    );

    // 当字段不可用时自动回退
    useEffect(() => {
        if (!colorRenderAttributeName) return;
        if (attributeConfigsLoading) return;
        const cfg = attributeConfigs.find((c) => c.attributeName === colorRenderAttributeName);
        if (!cfg || !(cfg.attributeType === "select" || cfg.attributeType === "user")) {
            const timeoutId = setTimeout(() => {
                setColorRenderAttributeNameAndPersist(null);
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [attributeConfigs, attributeConfigsLoading, colorRenderAttributeName, setColorRenderAttributeNameAndPersist]);

    // 激活的颜色配置
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

    // 图例项
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
                const ai = orderIndex.get(a.value);
                const bi = orderIndex.get(b.value);
                if (ai != null && bi != null) return ai - bi;
                if (ai != null) return -1;
                if (bi != null) return 1;
                return a.value.localeCompare(b.value);
            })
            .map((r) => {
                const label = activeOptionLabelMap?.get(r.value) ?? r.value;
                return { color: r.color, label };
            });
    }, [activeColorConfig, activeColorMap, activeOptionLabelMap]);

    // 甘特图时间范围状态
    const today = dayjs();
    const [ganttStartDate, setGanttStartDate] = useState<dayjs.Dayjs>(today.subtract(1, "week"));
    const [ganttEndDate, setGanttEndDate] = useState<dayjs.Dayjs>(today.add(3, "week"));

    // 视图类型状态
    const [viewType, setViewType] = useState<ViewType>("Day");

    // lineHeight 配置
    const [lineHeightMode, setLineHeightMode] = useState<LineHeightMode>(DEFAULT_LINE_HEIGHT_MODE);
    const [customLineHeight, setCustomLineHeight] = useState(DEFAULT_CUSTOM_LINE_HEIGHT);

    // slotMinWidth 配置
    const [slotMinWidthMode, setSlotMinWidthMode] = useState<SlotMinWidthMode>(DEFAULT_SLOT_MIN_WIDTH_MODE);
    const [customSlotMinWidth, setCustomSlotMinWidth] = useState(DEFAULT_CUSTOM_SLOT_MIN_WIDTH);

    // 计算实际使用的值
    const actualLineHeight =
        lineHeightMode === "custom" ? customLineHeight : LINE_HEIGHT_PRESETS[lineHeightMode];
    const actualSlotMinWidth =
        slotMinWidthMode === "custom" ? customSlotMinWidth : SLOT_MIN_WIDTH_PRESETS[slotMinWidthMode];

    return {
        // 颜色渲染
        colorRenderAttributeName,
        setColorRenderAttributeNameAndPersist,
        activeColorConfig,
        activeColorMap: activeColorMap as ColorMap | null,
        legendItems,

        // 列配置
        availableColumns,
        selectedColumnKeys,
        setSelectedColumnKeysAndPersist,

        // 时间范围
        ganttStartDate,
        setGanttStartDate,
        ganttEndDate,
        setGanttEndDate,

        // 视图类型
        viewType,
        setViewType,

        // 行高配置
        lineHeightMode,
        setLineHeightMode,
        customLineHeight,
        setCustomLineHeight,
        actualLineHeight,

        // 时间槽宽度配置
        slotMinWidthMode,
        setSlotMinWidthMode,
        customSlotMinWidth,
        setCustomSlotMinWidth,
        actualSlotMinWidth,
    };
};

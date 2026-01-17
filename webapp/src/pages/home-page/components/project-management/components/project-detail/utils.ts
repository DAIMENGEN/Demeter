import dayjs from "dayjs";
import {type JsonValue, type TaskAttributeConfig, TaskType, TaskTypeLabels} from "@Webapp/api";
import {
    normalizeColorMapToRows,
    normalizeOptionsToRows,
    normalizeUserOptionsToRows
} from "@Webapp/pages/home-page/components/project-management/components/project-detail/components/task-attribute-config-drawer/serializers.ts";
import type {Checkpoint, Milestone, Resource, Event} from "schedulant";

export const safeDayjs = (value: string) => {
    const d = dayjs(value);
    return d.isValid() ? d : dayjs();
};

export const RESOURCE_COLUMN_TITLE_KEY = "title";

export const CUSTOM_ATTRIBUTE_PREFIX = "ca.";

type ColorMap = ReadonlyMap<string, string>;

export const ensureTitleSelected = (keys: readonly string[]) => {
    const set = new Set(keys);
    set.add(RESOURCE_COLUMN_TITLE_KEY);
    return Array.from(set);
};

export const normalizeExtendedPropValue = (v: unknown): string | number | boolean | null | undefined => {
    if (v == null) return v as null | undefined;
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return v;
    return null;
};

export const buildColorMap = (valueColorMap: JsonValue | null): ColorMap => {
    const rows = normalizeColorMapToRows(valueColorMap);
    return new Map(rows.map((r) => [r.value, r.color] as const));
};

export const buildSelectValueLabelMap = (options: JsonValue | null): DisplayValueMap => {
    const rows = normalizeOptionsToRows(options);
    return new Map(rows.map((r) => [String(r.value), r.label] as const));
};

export const buildUserValueLabelMap = (options: JsonValue | null): DisplayValueMap => {
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

export const toScalarString = (v: JsonValue | undefined): string | null => {
    if (v == null) return null;
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    return null;
};

export const toUserIdFromJson = (v: JsonValue | undefined): string | null => {
    if (v == null) return null;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
    if (typeof v === "object" && !Array.isArray(v)) {
        const obj = v as Record<string, JsonValue>;
        const inner = obj.value;
        if (typeof inner === "string" || typeof inner === "number" || typeof inner === "boolean") return String(inner);
    }
    return null;
};

export const getDisplayFieldKey = (key: string): string => {
    // taskType 显示 label
    if (key === "taskType") return "taskTypeLabel";
    // 自定义字段一律用 <key>Label 展示（key 已包含 ca. 前缀）
    if (key.startsWith(CUSTOM_ATTRIBUTE_PREFIX)) return `${key}Label`;
    return key;
};

export const tasksToSchedulantModels = (
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
            startDateTime: dayjs(t.startDateTime).format("YYYY-MM-DD"),
            endDateTime: dayjs(t.endDateTime).format("YYYY-MM-DD"),
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

export const calcFractionalOrder = (prev?: number, next?: number) => {
    if (prev != null && next != null) return (prev + next) / 2;
    if (prev != null) return prev + 1;
    if (next != null) return next - 1;
    return 0;
};

export const jsonValueToString = (v: JsonValue | undefined): string | null => {
    if (v == null) return null;
    if (typeof v === "string") {
        const s = v.trim();
        return s ? s : null;
    }
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    return null;
};

type DisplayValueMap = ReadonlyMap<string, string>;

export const buildOptionLabelMap = (attributeType: string, options: JsonValue | null): ReadonlyMap<string, string> => {
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
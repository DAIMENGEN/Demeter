import type {JsonValue} from "@Webapp/api/modules/project";

import type {ColorMapRow, SelectOptionRow} from "./types.ts";

export const normalizeOptionsToRows = (options: JsonValue | null): SelectOptionRow[] => {
    if (!options) return [];

    if (Array.isArray(options)) {
        return options
            .map((item): SelectOptionRow | null => {
                if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
                    const v = String(item);
                    return {label: v, value: v};
                }
                if (item && typeof item === "object" && !Array.isArray(item)) {
                    const label = (item as Record<string, JsonValue>).label;
                    const value = (item as Record<string, JsonValue>).value;
                    if (
                        typeof label === "string" &&
                        (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
                    ) {
                        return {label, value: String(value)};
                    }
                }
                return null;
            })
            .filter((x): x is SelectOptionRow => Boolean(x));
    }

    return [];
};

/**
 * 为 user 类型专用：将 options 转换成 labelInValue 格式
 * value 字段为 { value: string; label: string } 对象，符合 antd Select labelInValue 的要求
 */
export const normalizeUserOptionsToRows = (options: JsonValue | null): SelectOptionRow[] => {
    if (!options) return [];

    if (Array.isArray(options)) {
        return options
            .map((item): SelectOptionRow | null => {
                if (item && typeof item === "object" && !Array.isArray(item)) {
                    const label = (item as Record<string, JsonValue>).label;
                    const value = (item as Record<string, JsonValue>).value;
                    if (
                        typeof label === "string" &&
                        (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
                    ) {
                        const strValue = String(value);
                        // 返回 labelInValue 格式，value 是 { value, label } 对象
                        return {label, value: {value: strValue, label}};
                    }
                }
                return null;
            })
            .filter((x): x is SelectOptionRow => Boolean(x));
    }

    return [];
};


export const userRowsToOptionsJson = (rows?: SelectOptionRow[]): JsonValue | null => {
    const normalized = (rows ?? [])
        .map((r) => {
            const raw = r.value;
            if (typeof raw === "string") return {
                label: "",
                value: ""
            };
            // user: value is { value: userId, label?: ReactNode }
            return {
                label: raw.label,
                value: raw.value
            };
        })
        .filter((r) => r.label && r.value);
    if (!normalized.length) return null;
    return normalized as unknown as JsonValue;
}

export const selectRowsToOptionsJson = (rows?: SelectOptionRow[]): JsonValue | null => {
    const normalized = (rows ?? [])
        .map((raw) => {
            return {
                label: raw.label,
                value: raw.value
            };
        })
        .filter((r) => r.label && r.value);
    if (!normalized.length) return null;
    return normalized as unknown as JsonValue;
};

export const normalizeColorMapToRows = (valueColorMap: JsonValue | null): ColorMapRow[] => {
    if (!valueColorMap || typeof valueColorMap !== "object" || Array.isArray(valueColorMap)) return [];

    const obj = valueColorMap as Record<string, JsonValue>;
    return Object.entries(obj)
        .map(([value, color]): ColorMapRow | null => {
            if (typeof color !== "string") return null;
            const c = color.trim() || "#1677ff";
            return {value, color: c};
        })
        .filter((x): x is ColorMapRow => Boolean(x));
};

export const rowsToColorMapJson = (rows?: ColorMapRow[]): JsonValue | null => {
    const acc: Record<string, JsonValue> = {};
    for (const row of rows ?? []) {
        const key = (row.value ?? "").trim();
        const color = (row.color ?? "").trim();
        if (!key || !color) continue;
        acc[key] = color;
    }
    return Object.keys(acc).length ? (acc as unknown as JsonValue) : null;
};


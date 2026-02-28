import type {LegendItem} from "./components/schedulant-legend";
import type {SchedulantViewType} from "schedulant/dist/types/schedulant-view";

export type AvailableColumn = {
    key: string;
    label: string;
    locked?: boolean;
    defaultVisible?: boolean;
};

export type LineHeightMode = "small" | "medium" | "large" | "custom";
export type SlotMinWidthMode = "small" | "medium" | "large" | "custom";

export const LINE_HEIGHT_PRESETS: Record<Exclude<LineHeightMode, "custom">, number> = {
    small: 30,
    medium: 40,
    large: 50,
};

export const SLOT_MIN_WIDTH_PRESETS: Record<Exclude<SlotMinWidthMode, "custom">, number> = {
    small: 40,
    medium: 50,
    large: 60,
};

export const DEFAULT_LINE_HEIGHT_MODE: LineHeightMode = "medium";
export const DEFAULT_CUSTOM_LINE_HEIGHT = 40;
export const DEFAULT_SLOT_MIN_WIDTH_MODE: SlotMinWidthMode = "medium";
export const DEFAULT_CUSTOM_SLOT_MIN_WIDTH = 50;

export type {LegendItem};

export const SCHEDULANT_VIEW_UNIT_MAP: Record<SchedulantViewType, "day" | "week" | "month" | "quarter" | "year"> = {
    Day: "day",
    Week: "week",
    Month: "month",
    Quarter: "quarter",
    Year: "year",
};

export const SCHEDULANT_VIEW_PICKER_MAP: Record<SchedulantViewType, "date" | "week" | "month" | "quarter" | "year"> = {
    Day: "date",
    Week: "week",
    Month: "month",
    Quarter: "quarter",
    Year: "year",
};

export const SCHEDULANT_VIEW_DEFAULT_RANGE_MAP: Record<SchedulantViewType, number> = {
    Day: 30,      // 30天
    Week: 12,     // 12周
    Month: 3,     // 3个月
    Quarter: 4,   // 4个季度
    Year: 1,      // 1年
};

export const SCHEDULANT_VIEW_OPTIONS_KEYS: { labelKey: string; value: SchedulantViewType }[] = [
    {labelKey: "schedulant.viewDay", value: "Day" as SchedulantViewType},
    {labelKey: "schedulant.viewWeek", value: "Week" as SchedulantViewType},
    {labelKey: "schedulant.viewMonth", value: "Month" as SchedulantViewType},
    {labelKey: "schedulant.viewQuarter", value: "Quarter" as SchedulantViewType},
    {labelKey: "schedulant.viewYear", value: "Year" as SchedulantViewType},
];


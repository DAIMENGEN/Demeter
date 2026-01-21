import type { LegendItem } from "./components";

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

export type GanttDataState = {
    events: import("schedulant").Event[];
    resources: import("schedulant").Resource[];
    milestones: import("schedulant").Milestone[];
    checkpoints: import("schedulant").Checkpoint[];
};

export type { LegendItem };

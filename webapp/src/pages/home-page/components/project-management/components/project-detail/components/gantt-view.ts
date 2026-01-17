// Shared gantt view types/constants and non-component exports.

export type ViewType = "Day" | "Week" | "Month" | "Quarter" | "Year";

export type AvailableColumn = {
    key: string;
    label: string;
    locked?: boolean;
    defaultVisible?: boolean;
};

// 视图对应的时间单位
export const viewUnitMap: Record<ViewType, "day" | "week" | "month" | "quarter" | "year"> = {
    Day: "day",
    Week: "week",
    Month: "month",
    Quarter: "quarter",
    Year: "year",
};

// 视图对应的 DatePicker picker 类型
export const viewPickerMap: Record<ViewType, "date" | "week" | "month" | "quarter" | "year"> = {
    Day: "date",
    Week: "week",
    Month: "month",
    Quarter: "quarter",
    Year: "year",
};

// 视图对应的默认时间范围（用于"跳转到今天"功能）
export const viewDefaultRangeMap: Record<ViewType, number> = {
    Day: 30,      // 30天
    Week: 12,     // 12周
    Month: 3,     // 3个月
    Quarter: 4,   // 4个季度
    Year: 1,      // 1年
};

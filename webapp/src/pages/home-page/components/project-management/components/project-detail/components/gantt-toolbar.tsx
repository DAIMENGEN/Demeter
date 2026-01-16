import React from "react";
import {Button, DatePicker, Select, Space, Tooltip} from "antd";
import {
    ArrowLeftOutlined,
    CalendarOutlined,
    LeftOutlined,
    PlusOutlined,
    RightOutlined,
    SettingOutlined
} from "@ant-design/icons";
import type {Dayjs} from "dayjs";
import {DisplayConfigPopover} from "./display-config-popover.tsx";
import type {TaskAttributeConfig} from "@Webapp/api/modules/project";

// 视图类型定义
export type ViewType = "Day" | "Week" | "Month" | "Quarter" | "Year";

// 视图选项
const viewOptions = [
    {label: "日", value: "Day" as ViewType},
    {label: "周", value: "Week" as ViewType},
    {label: "月", value: "Month" as ViewType},
    {label: "季", value: "Quarter" as ViewType},
    {label: "年", value: "Year" as ViewType},
];

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

export interface GanttToolbarProps {
    projectName: string;
    viewType: ViewType;
    ganttStartDate: Dayjs | null;
    ganttEndDate: Dayjs | null;
    onViewTypeChange: (value: ViewType) => void;
    onStartDateChange: (date: Dayjs | null) => void;
    onEndDateChange: (date: Dayjs | null) => void;
    onShiftLeft: () => void;
    onShiftRight: () => void;
    onJumpToToday: () => void;
    onBack: () => void;
    onOpenTaskAttributeConfig: () => void;
    onOpenCreateTask: () => void;

    // 显示配置相关
    lineHeightMode: "small" | "medium" | "large" | "custom";
    customLineHeight: number;
    slotMinWidthMode: "small" | "medium" | "large" | "custom";
    customSlotMinWidth: number;
    actualLineHeight: number;
    actualSlotMinWidth: number;
    visibleColumns: {
        title: boolean;
        order: boolean;
        parentId: boolean;
    };
    onLineHeightModeChange: (mode: "small" | "medium" | "large" | "custom") => void;
    onCustomLineHeightChange: (value: number) => void;
    onSlotMinWidthModeChange: (mode: "small" | "medium" | "large" | "custom") => void;
    onCustomSlotMinWidthChange: (value: number) => void;
    onVisibleColumnsChange: (columns: {title: boolean; order: boolean; parentId: boolean}) => void;

    /**
     * 用于“任务颜色渲染”的字段来源（只取 select/user 自定义字段）。
     * 由 ProjectDetail 拉取并传入。
     */
    attributeConfigs?: TaskAttributeConfig[];
    colorRenderAttributeName?: string | null;
    onColorRenderAttributeNameChange?: (name: string | null) => void;
}

export const GanttToolbar: React.FC<GanttToolbarProps> = ({
    projectName,
    viewType,
    ganttStartDate,
    ganttEndDate,
    onViewTypeChange,
    onStartDateChange,
    onEndDateChange,
    onShiftLeft,
    onShiftRight,
    onJumpToToday,
    onBack,
    onOpenTaskAttributeConfig,
    onOpenCreateTask,
    lineHeightMode,
    customLineHeight,
    slotMinWidthMode,
    customSlotMinWidth,
    actualLineHeight,
    actualSlotMinWidth,
    visibleColumns,
    onLineHeightModeChange,
    onCustomLineHeightChange,
    onSlotMinWidthModeChange,
    onCustomSlotMinWidthChange,
    onVisibleColumnsChange,
    attributeConfigs,
    colorRenderAttributeName,
    onColorRenderAttributeNameChange,
}) => {
    return (
        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "12px"}}>
            <Space size="middle" align="center" style={{flex: "0 0 auto"}}>
                <span style={{fontSize: "14px", fontWeight: 500}}>
                    项目名称：{projectName}
                </span>
            </Space>
            <Space size="middle" align="center" style={{flex: "1 1 auto", justifyContent: "flex-end"}}>
                <Space size="small">
                    <Tooltip title="视图切换">
                        <Select
                            value={viewType}
                            onChange={onViewTypeChange}
                            options={viewOptions}
                            style={{width: 80}}
                        />
                    </Tooltip>
                    <Tooltip title="跳转到今天">
                        <Button
                            type="primary"
                            icon={<CalendarOutlined/>}
                            onClick={onJumpToToday}
                        />
                    </Tooltip>
                    <Tooltip title="向前移动时间范围">
                        <Button
                            type="primary"
                            icon={<LeftOutlined/>}
                            onClick={onShiftLeft}
                            disabled={!ganttStartDate || !ganttEndDate}
                        />
                    </Tooltip>
                    <Tooltip title="向后移动时间范围">
                        <Button
                            type="primary"
                            icon={<RightOutlined/>}
                            onClick={onShiftRight}
                            disabled={!ganttStartDate || !ganttEndDate}
                        />
                    </Tooltip>
                    <DatePicker
                        value={ganttStartDate}
                        onChange={onStartDateChange}
                        picker={viewPickerMap[viewType]}
                        placeholder="开始时间"
                        format={
                            viewType === "Day" ? "YYYY-MM-DD" :
                            viewType === "Week" ? "YYYY-wo" :
                            viewType === "Month" ? "YYYY-MM" :
                            viewType === "Quarter" ? "YYYY-Q" :
                            "YYYY"
                        }
                        style={{width: 140}}
                    />
                    <span>-</span>
                    <DatePicker
                        value={ganttEndDate}
                        onChange={onEndDateChange}
                        picker={viewPickerMap[viewType]}
                        placeholder="结束时间"
                        format={
                            viewType === "Day" ? "YYYY-MM-DD" :
                            viewType === "Week" ? "YYYY-wo" :
                            viewType === "Month" ? "YYYY-MM" :
                            viewType === "Quarter" ? "YYYY-Q" :
                            "YYYY"
                        }
                        style={{width: 140}}
                        disabledDate={(current) => {
                            if (!ganttStartDate) return false;
                            const unit = viewUnitMap[viewType];
                            return current && current.isBefore(ganttStartDate, unit as any);
                        }}
                    />
                    <DisplayConfigPopover
                        lineHeightMode={lineHeightMode}
                        customLineHeight={customLineHeight}
                        slotMinWidthMode={slotMinWidthMode}
                        customSlotMinWidth={customSlotMinWidth}
                        actualLineHeight={actualLineHeight}
                        actualSlotMinWidth={actualSlotMinWidth}
                        visibleColumns={visibleColumns}
                        onLineHeightModeChange={onLineHeightModeChange}
                        onCustomLineHeightChange={onCustomLineHeightChange}
                        onSlotMinWidthModeChange={onSlotMinWidthModeChange}
                        onCustomSlotMinWidthChange={onCustomSlotMinWidthChange}
                        onVisibleColumnsChange={onVisibleColumnsChange}
                        attributeConfigs={attributeConfigs}
                        colorRenderAttributeName={colorRenderAttributeName}
                        onColorRenderAttributeNameChange={onColorRenderAttributeNameChange}
                    />
                    <Tooltip title="创建任务">
                        <Button
                            type="primary"
                            icon={<PlusOutlined/>}
                            onClick={onOpenCreateTask}
                        />
                    </Tooltip>
                    <Tooltip title="配置任务自定义字段">
                        <Button
                            type="primary"
                            icon={<SettingOutlined/>}
                            onClick={onOpenTaskAttributeConfig}
                        />
                    </Tooltip>
                    <Tooltip title="返回项目列表">
                        <Button
                            type="primary"
                            icon={<ArrowLeftOutlined/>}
                            onClick={onBack}
                        />
                    </Tooltip>
                </Space>
            </Space>
        </div>
    );
};

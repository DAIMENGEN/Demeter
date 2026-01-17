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
import {viewPickerMap, type AvailableColumn, type ViewType} from "./gantt-view.ts";

// 视图选项
const viewOptions = [
    {label: "日", value: "Day" as ViewType},
    {label: "周", value: "Week" as ViewType},
    {label: "月", value: "Month" as ViewType},
    {label: "季", value: "Quarter" as ViewType},
    {label: "年", value: "Year" as ViewType},
];

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

    availableColumns: AvailableColumn[];
    selectedColumnKeys: string[];
    onSelectedColumnKeysChange: (updater: string[] | ((prev: string[]) => string[])) => void;

    onLineHeightModeChange: (mode: "small" | "medium" | "large" | "custom") => void;
    onCustomLineHeightChange: (value: number) => void;
    onSlotMinWidthModeChange: (mode: "small" | "medium" | "large" | "custom") => void;
    onCustomSlotMinWidthChange: (value: number) => void;

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
    availableColumns,
    selectedColumnKeys,
    onSelectedColumnKeysChange,
    onLineHeightModeChange,
    onCustomLineHeightChange,
    onSlotMinWidthModeChange,
    onCustomSlotMinWidthChange,
    attributeConfigs,
    colorRenderAttributeName,
    onColorRenderAttributeNameChange,
}) => {
    const disabledEndDate = (current: Dayjs | null, start: Dayjs | null, viewType: ViewType) => {
        if (!start || !current) return false;

        switch (viewType) {
            case "Day":
                return current.isBefore(start, "day");
            case "Week":
                return current.isBefore(start, "week");
            case "Month":
                return current.isBefore(start, "month");
            case "Quarter":
                // dayjs typings don't include 'quarter' in isBefore(). Month granularity is close enough for the picker semantics.
                return current.isBefore(start, "month");
            case "Year":
                return current.isBefore(start, "year");
            default:
                return current.isBefore(start, "day");
        }
    };

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
                        disabledDate={(current) => disabledEndDate(current, ganttStartDate, viewType)}
                    />
                    <DisplayConfigPopover
                        lineHeightMode={lineHeightMode}
                        customLineHeight={customLineHeight}
                        slotMinWidthMode={slotMinWidthMode}
                        customSlotMinWidth={customSlotMinWidth}
                        actualLineHeight={actualLineHeight}
                        actualSlotMinWidth={actualSlotMinWidth}
                        availableColumns={availableColumns}
                        selectedColumnKeys={selectedColumnKeys}
                        onSelectedColumnKeysChange={onSelectedColumnKeysChange}
                        onLineHeightModeChange={onLineHeightModeChange}
                        onCustomLineHeightChange={onCustomLineHeightChange}
                        onSlotMinWidthModeChange={onSlotMinWidthModeChange}
                        onCustomSlotMinWidthChange={onCustomSlotMinWidthChange}
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

import React, {useState} from "react";
import {useTranslation} from "react-i18next";
import {Button, DatePicker, Select, Space, Tooltip} from "antd";
import "./schedulant-toolbar.scss";
import {
    ArrowLeftOutlined,
    CalendarOutlined,
    LeftOutlined,
    PlusOutlined,
    RightOutlined,
    SettingOutlined
} from "@ant-design/icons";
import {
    AttributeConfigDrawer
} from "@Webapp/pages/home-page/components/project-management/components/project-detail/components/schedulant-toolbar/components/attribute-config-drawer";
import {
    SchedulantConfig,
} from "@Webapp/pages/home-page/components/project-management/components/project-detail/components/schedulant-config";
import type {ProjectTaskAttributeConfig} from "@Webapp/api";
import type {AvailableColumn} from "../../constants.ts";
import {SCHEDULANT_VIEW_OPTIONS_KEYS, SCHEDULANT_VIEW_PICKER_MAP,} from "../../constants.ts";
import type {Dayjs} from "dayjs";
import type {SchedulantViewType} from "schedulant/dist/types/schedulant-view";

export interface SchedulantToolbarProps {
    projectId: string;
    projectName: string;
    schedulantViewType: SchedulantViewType;
    schedulantStartDate?: Dayjs;
    schedulantEndDate?: Dayjs;
    onViewTypeChange?: (viewType: SchedulantViewType) => void;
    onStartDateChange?: (date: Dayjs) => void;
    onEndDateChange?: (date: Dayjs) => void;
    onShiftLeft?: () => void;
    onShiftRight?: () => void;
    onJumpToToday?: () => void;
    onOpenCreateTask?: () => void;
    onBack?: () => void;

    // 显示配置 props
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
    attributeConfigs?: ProjectTaskAttributeConfig[];
    attributeConfigsLoading?: boolean;
    colorRenderAttributeName?: string | null;
    onColorRenderAttributeNameChange?: (name: string | null) => void;
    refetchAttributeConfigs?: () => Promise<void> | void;
}


export const SchedulantToolbar = React.forwardRef<HTMLDivElement, SchedulantToolbarProps>(({
                                                                                               projectId,
                                                                                               projectName,
                                                                                               schedulantViewType,
                                                                                               schedulantStartDate,
                                                                                               schedulantEndDate,
                                                                                               onViewTypeChange,
                                                                                               onStartDateChange,
                                                                                               onEndDateChange,
                                                                                               onShiftLeft,
                                                                                               onShiftRight,
                                                                                               onJumpToToday,
                                                                                               onOpenCreateTask,
                                                                                               onBack,
                                                                                               // 显示配置
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
                                                                                               attributeConfigsLoading,
                                                                                               colorRenderAttributeName,
                                                                                               onColorRenderAttributeNameChange,
                                                                                               refetchAttributeConfigs,
                                                                                           }, ref) => {
    const [attributeDrawerOpen, setAttributeDrawerOpen] = useState(false);
    const {t} = useTranslation();
    return (
        <div ref={ref} className="schedulant-toolbar">
            <div className="schedulant-toolbar__container">
                <Space size="middle" align="center" className="schedulant-toolbar__left">
                    <span className="schedulant-toolbar__project-name">
                        {t("toolbar.projectLabel", {name: projectName})}
                    </span>
                </Space>
                <Space size="small" align="center" className="schedulant-toolbar__right">
                    <Tooltip title={t("toolbar.switchView")}>
                        <Select value={schedulantViewType}
                                options={SCHEDULANT_VIEW_OPTIONS_KEYS.map(o => ({label: t(o.labelKey), value: o.value}))}
                                onChange={onViewTypeChange}/>
                    </Tooltip>
                    <Tooltip title={t("toolbar.jumpToToday")}>
                        <Button type="primary" icon={<CalendarOutlined/>} onClick={onJumpToToday}/>
                    </Tooltip>
                    <Tooltip title={t("toolbar.shiftLeft")}>
                        <Button type="primary" icon={<LeftOutlined/>} onClick={onShiftLeft}/>
                    </Tooltip>
                    <Tooltip title={t("toolbar.shiftRight")}>
                        <Button type="primary" icon={<RightOutlined/>} onClick={onShiftRight}/>
                    </Tooltip>
                    <DatePicker
                        value={schedulantStartDate}
                        onChange={(date) => date && onStartDateChange?.(date)}
                        picker={SCHEDULANT_VIEW_PICKER_MAP[schedulantViewType]}
                        placeholder={t("toolbar.startTime")}
                        format={
                            schedulantViewType === "Day" ? "YYYY-MM-DD" :
                                schedulantViewType === "Week" ? "YYYY-wo" :
                                    schedulantViewType === "Month" ? "YYYY-MM" :
                                        schedulantViewType === "Quarter" ? "YYYY-Q" :
                                            "YYYY"
                        }
                        style={{width: 140}}/>
                    <span>-</span>
                    <DatePicker
                        value={schedulantEndDate}
                        onChange={(date) => date && onEndDateChange?.(date)}
                        picker={SCHEDULANT_VIEW_PICKER_MAP[schedulantViewType]}
                        placeholder={t("toolbar.endTime")}
                        format={
                            schedulantViewType === "Day" ? "YYYY-MM-DD" :
                                schedulantViewType === "Week" ? "YYYY-wo" :
                                    schedulantViewType === "Month" ? "YYYY-MM" :
                                        schedulantViewType === "Quarter" ? "YYYY-Q" :
                                            "YYYY"
                        }
                        style={{width: 140}}/>
                    <Tooltip title={t("toolbar.createTask")}>
                        <Button type="primary" icon={<PlusOutlined/>} onClick={onOpenCreateTask}/>
                    </Tooltip>
                    <SchedulantConfig
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
                    <Tooltip title={t("toolbar.configAttributes")}>
                        <Button type="primary" icon={<SettingOutlined/>} onClick={() => setAttributeDrawerOpen(true)}/>
                    </Tooltip>
                    <Tooltip title={t("toolbar.backToList")}>
                        <Button type="primary" icon={<ArrowLeftOutlined/>} onClick={onBack}/>
                    </Tooltip>
                </Space>
            </div>
            <AttributeConfigDrawer open={attributeDrawerOpen} projectId={projectId}
                                   configs={attributeConfigs ?? []}
                                   configsLoading={attributeConfigsLoading ?? false}
                                   refetchConfigs={refetchAttributeConfigs ?? (() => {})}
                                   onClose={() => setAttributeDrawerOpen(false)}/>
        </div>
    );
});

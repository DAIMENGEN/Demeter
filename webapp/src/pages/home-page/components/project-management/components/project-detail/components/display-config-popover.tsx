import React, {useMemo, useState} from "react";
import {Button, Checkbox, Collapse, InputNumber, Popover, Segmented, Select, Tooltip} from "antd";
import {ControlOutlined} from "@ant-design/icons";
import type {TaskAttributeConfig} from "@Webapp/api/modules/project";

export interface DisplayConfigPopoverProps {
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
     * 任务颜色渲染字段来源：仅允许用户自定义字段中的 select/user 类型。
     * 传入以便在“显示配置”中选择用于上色的字段。
     */
    attributeConfigs?: TaskAttributeConfig[];
    /** 当前用于渲染颜色的 attributeName；null/undefined 表示不启用 */
    colorRenderAttributeName?: string | null;
    onColorRenderAttributeNameChange?: (name: string | null) => void;
}

export const DisplayConfigPopover: React.FC<DisplayConfigPopoverProps> = ({
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
    const [open, setOpen] = useState(false);

    type PresetMode = "small" | "medium" | "large" | "custom";

    const colorRenderFieldOptions = useMemo(() => {
        const configs = attributeConfigs ?? [];
        const renderable = configs
            .filter((c) => c.attributeName && (c.attributeType === "select" || c.attributeType === "user"))
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        return [
            {label: "不按字段上色", value: ""},
            ...renderable.map((c) => ({
                label: c.attributeLabel || c.attributeName,
                value: c.attributeName
            }))
        ];
    }, [attributeConfigs]);

    const hideColorRender = !onColorRenderAttributeNameChange;

    return (
        <Popover
            trigger="click"
            placement="bottomLeft"
            open={open}
            onOpenChange={setOpen}
            content={
                <div style={{display: "flex", flexDirection: "column", gap: "16px", minWidth: "280px"}}>
                    {/* 任务颜色渲染 */}
                    {!hideColorRender && (
                        <div>
                            <div style={{marginBottom: "8px", fontWeight: 500, fontSize: "14px"}}>
                                任务颜色渲染
                            </div>
                            <Select
                                value={colorRenderAttributeName ?? ""}
                                onChange={(v) => onColorRenderAttributeNameChange(v ? String(v) : null)}
                                options={colorRenderFieldOptions}
                                style={{width: "100%"}}
                                placeholder="选择用于上色的字段"
                            />
                            <div style={{marginTop: "4px", fontSize: "12px", color: "#8c8c8c"}}>
                                仅支持自定义字段中的「人员 / 选项」类型
                            </div>
                        </div>
                    )}

                    {/* 行高配置 */}
                    <div>
                        <div style={{marginBottom: "8px", fontWeight: 500, fontSize: "14px"}}>
                            行高
                        </div>
                        <Segmented
                            value={lineHeightMode}
                            onChange={(value) => {
                                const next = value as PresetMode;
                                onLineHeightModeChange(next);
                            }}
                            options={[
                                {label: "小", value: "small"},
                                {label: "中", value: "medium"},
                                {label: "大", value: "large"},
                                {label: "自定义", value: "custom"}
                            ]}
                            block
                        />
                        {lineHeightMode === "custom" && (
                            <div style={{marginTop: "8px"}}>
                                <InputNumber
                                    value={customLineHeight}
                                    onChange={(value) => onCustomLineHeightChange(value || 40)}
                                    min={20}
                                    max={100}
                                    suffix="px"
                                    style={{width: "100%"}}
                                    placeholder="输入行高"
                                />
                            </div>
                        )}
                        <div style={{marginTop: "4px", fontSize: "12px", color: "#8c8c8c"}}>
                            当前值: {actualLineHeight}px
                        </div>
                    </div>

                    {/* 时间槽最小宽度配置 */}
                    <div>
                        <div style={{marginBottom: "8px", fontWeight: 500, fontSize: "14px"}}>
                            时间槽宽度
                        </div>
                        <Segmented
                            value={slotMinWidthMode}
                            onChange={(value) => {
                                const next = value as PresetMode;
                                onSlotMinWidthModeChange(next);
                            }}
                            options={[
                                {label: "小", value: "small"},
                                {label: "中", value: "medium"},
                                {label: "大", value: "large"},
                                {label: "自定义", value: "custom"}
                            ]}
                            block
                        />
                        {slotMinWidthMode === "custom" && (
                            <div style={{marginTop: "8px"}}>
                                <InputNumber
                                    value={customSlotMinWidth}
                                    onChange={(value) => onCustomSlotMinWidthChange(value || 50)}
                                    min={30}
                                    max={200}
                                    suffix="px"
                                    style={{width: "100%"}}
                                    placeholder="输入时间槽宽度"
                                />
                            </div>
                        )}
                        <div style={{marginTop: "4px", fontSize: "12px", color: "#8c8c8c"}}>
                            当前值: {actualSlotMinWidth}px
                        </div>
                    </div>

                    {/* 列配置 - 使用 Collapse 组件，默认折叠 */}
                    <Collapse
                        ghost
                        size="small"
                        items={[
                            {
                                key: "columns",
                                label: <span style={{fontWeight: 500, fontSize: "14px"}}>列配置</span>,
                                children: (
                                    <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
                                        <div
                                            style={{
                                                padding: "5px 12px",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                transition: "background-color 0.2s",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)"}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                            onClick={() => onVisibleColumnsChange({...visibleColumns, title: !visibleColumns.title})}
                                        >
                                            <Checkbox checked={visibleColumns.title}/>
                                            <span>任务/团队</span>
                                        </div>
                                        <div
                                            style={{
                                                padding: "5px 12px",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                transition: "background-color 0.2s",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)"}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                            onClick={() => onVisibleColumnsChange({...visibleColumns, order: !visibleColumns.order})}
                                        >
                                            <Checkbox checked={visibleColumns.order}/>
                                            <span>排序</span>
                                        </div>
                                        <div
                                            style={{
                                                padding: "5px 12px",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                transition: "background-color 0.2s",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)"}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                            onClick={() => onVisibleColumnsChange({...visibleColumns, parentId: !visibleColumns.parentId})}
                                        >
                                            <Checkbox checked={visibleColumns.parentId}/>
                                            <span>父级ID</span>
                                        </div>
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>
            }
        >
            <Tooltip title="显示配置">
                <Button
                    type="primary"
                    icon={<ControlOutlined />}
                    onClick={() => setOpen(!open)}
                />
            </Tooltip>
        </Popover>
    );
};

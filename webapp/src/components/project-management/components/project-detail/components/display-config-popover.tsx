import React, {useState} from "react";
import {Button, Checkbox, Collapse, InputNumber, Popover, Segmented, Tooltip} from "antd";
import {SettingOutlined} from "@ant-design/icons";

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
}) => {
    const [open, setOpen] = useState(false);

    return (
        <Popover
            trigger="click"
            placement="bottomLeft"
            open={open}
            onOpenChange={setOpen}
            content={
                <div style={{display: "flex", flexDirection: "column", gap: "16px", minWidth: "280px"}}>
                    {/* 行高配置 */}
                    <div>
                        <div style={{marginBottom: "8px", fontWeight: 500, fontSize: "14px"}}>行高</div>
                        <Segmented
                            value={lineHeightMode}
                            onChange={(value) => onLineHeightModeChange(value as any)}
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
                        <div style={{marginBottom: "8px", fontWeight: 500, fontSize: "14px"}}>时间槽宽度</div>
                        <Segmented
                            value={slotMinWidthMode}
                            onChange={(value) => onSlotMinWidthModeChange(value as any)}
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
                    icon={<SettingOutlined/>}
                    onClick={() => setOpen(!open)}
                />
            </Tooltip>
        </Popover>
    );
};


import React, {useMemo, useState} from "react";
import {Button, Checkbox, Collapse, InputNumber, Popover, Segmented, Select, Tooltip} from "antd";
import {ControlOutlined} from "@ant-design/icons";
import type {ProjectTaskAttributeConfig} from "@Webapp/api/modules/project";
import type {AvailableColumn} from "./gantt-view.ts";

export interface DisplayConfigPopoverProps {
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
     * 任务颜色渲染字段来源：仅允许用户自定义字段中的 select/user 类型。
     * 传入以便在“显示配置”中选择用于上色的字段。
     */
    attributeConfigs?: ProjectTaskAttributeConfig[];
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

    const columnsForUi = useMemo(() => {
        const cols = availableColumns.slice();
        cols.sort((a, b) => {
            if (a.locked && !b.locked) return -1;
            if (!a.locked && b.locked) return 1;
            const da = a.defaultVisible ? 0 : 1;
            const db = b.defaultVisible ? 0 : 1;
            if (da !== db) return da - db;
            return a.label.localeCompare(b.label);
        });
        return cols;
    }, [availableColumns]);

    const selectedSet = useMemo(() => new Set(selectedColumnKeys), [selectedColumnKeys]);

    const toggleColumn = (col: AvailableColumn) => {
        if (col.locked) return;
        onSelectedColumnKeysChange((prev) => {
            const set = new Set(prev);
            if (set.has(col.key)) {
                set.delete(col.key);
            } else {
                set.add(col.key);
            }
            return Array.from(set);
        });
    };

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

                    {/* 列配置 */}
                    <Collapse
                        ghost
                        size="small"
                        items={[
                            {
                                key: "columns",
                                label: <span style={{fontWeight: 500, fontSize: "14px"}}>列配置</span>,
                                children: (
                                    <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
                                        {columnsForUi.map((col) => {
                                            const checked = selectedSet.has(col.key);
                                            const disabled = Boolean(col.locked);
                                            return (
                                                <div
                                                    key={col.key}
                                                    style={{
                                                        padding: "5px 12px",
                                                        borderRadius: "4px",
                                                        cursor: disabled ? "not-allowed" : "pointer",
                                                        transition: "background-color 0.2s",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        opacity: disabled ? 0.7 : 1,
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (disabled) return;
                                                        e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = "transparent";
                                                    }}
                                                    onClick={() => toggleColumn(col)}
                                                >
                                                    <Checkbox checked={checked} disabled={disabled}/>
                                                    <span>{col.label}</span>
                                                </div>
                                            );
                                        })}
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

import React, {useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {Button, Checkbox, Collapse, InputNumber, Popover, Segmented, Select, Tooltip} from "antd";
import {ControlOutlined} from "@ant-design/icons";
import type {ProjectTaskAttributeConfig} from "@Webapp/api";
import type {AvailableColumn} from "../../constants.ts";

export interface SchedulantConfigProps {
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
    colorRenderAttributeName?: string | null;
    onColorRenderAttributeNameChange?: (name: string | null) => void;
}

export const SchedulantConfig: React.FC<SchedulantConfigProps> = ({
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
    const {t} = useTranslation();
    const [open, setOpen] = useState(false);

    type PresetMode = "small" | "medium" | "large" | "custom";

    const colorRenderFieldOptions = useMemo(() => {
        const configs = attributeConfigs ?? [];
        const renderable = configs
            .filter((c) => {
                if (!c.attributeName) return false;
                if (c.attributeType !== "select" && c.attributeType !== "user") return false;
                // 只展示已配置颜色映射的字段
                const vcm = c.valueColorMap;
                if (!vcm || typeof vcm !== "object" || Array.isArray(vcm) || !Object.keys(vcm).length) return false;
                return true;
            })
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        return [
            {label: t("displayConfig.colorRenderNone"), value: ""},
            ...renderable.map((c) => ({
                label: c.attributeLabel || c.attributeName,
                value: c.attributeName,
            })),
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
                                {t("displayConfig.colorRenderTitle")}
                            </div>
                            <Select
                                value={colorRenderAttributeName ?? ""}
                                onChange={(v) => onColorRenderAttributeNameChange!(v ? String(v) : null)}
                                options={colorRenderFieldOptions}
                                style={{width: "100%"}}
                                placeholder={t("displayConfig.colorRenderPlaceholder")}
                            />
                            <div style={{marginTop: "4px", fontSize: "12px", color: "#8c8c8c"}}>
                                {t("displayConfig.colorRenderHint")}
                            </div>
                        </div>
                    )}

                    {/* 行高配置 */}
                    <div>
                        <div style={{marginBottom: "8px", fontWeight: 500, fontSize: "14px"}}>
                            {t("displayConfig.lineHeight")}
                        </div>
                        <Segmented
                            value={lineHeightMode}
                            onChange={(value) => {
                                const next = value as PresetMode;
                                onLineHeightModeChange(next);
                            }}
                            options={[
                                {label: t("displayConfig.sizeSmall"), value: "small"},
                                {label: t("displayConfig.sizeMedium"), value: "medium"},
                                {label: t("displayConfig.sizeLarge"), value: "large"},
                                {label: t("displayConfig.sizeCustom"), value: "custom"},
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
                                    placeholder={t("displayConfig.inputLineHeight")}
                                />
                            </div>
                        )}
                        <div style={{marginTop: "4px", fontSize: "12px", color: "#8c8c8c"}}>
                            {t("displayConfig.currentValue", {value: actualLineHeight})}
                        </div>
                    </div>

                    {/* 时间槽最小宽度配置 */}
                    <div>
                        <div style={{marginBottom: "8px", fontWeight: 500, fontSize: "14px"}}>
                            {t("displayConfig.slotWidth")}
                        </div>
                        <Segmented
                            value={slotMinWidthMode}
                            onChange={(value) => {
                                const next = value as PresetMode;
                                onSlotMinWidthModeChange(next);
                            }}
                            options={[
                                {label: t("displayConfig.sizeSmall"), value: "small"},
                                {label: t("displayConfig.sizeMedium"), value: "medium"},
                                {label: t("displayConfig.sizeLarge"), value: "large"},
                                {label: t("displayConfig.sizeCustom"), value: "custom"},
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
                                    placeholder={t("displayConfig.inputSlotWidth")}
                                />
                            </div>
                        )}
                        <div style={{marginTop: "4px", fontSize: "12px", color: "#8c8c8c"}}>
                            {t("displayConfig.currentValue", {value: actualSlotMinWidth})}
                        </div>
                    </div>

                    {/* 列配置 */}
                    <Collapse
                        ghost
                        size="small"
                        items={[
                            {
                                key: "columns",
                                label: <span style={{fontWeight: 500, fontSize: "14px"}}>{t("displayConfig.columnConfig")}</span>,
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
                                ),
                            },
                        ]}
                    />
                </div>
            }
        >
            <Tooltip title={t("displayConfig.title")}>
                <Button
                    type="primary"
                    icon={<ControlOutlined/>}
                    onClick={() => setOpen(!open)}
                />
            </Tooltip>
        </Popover>
    );
};

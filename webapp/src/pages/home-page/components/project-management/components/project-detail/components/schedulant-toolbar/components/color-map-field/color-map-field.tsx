import React from "react";
import {useTranslation} from "react-i18next";
import {Button, ColorPicker, Form, Select, Space, Typography} from "antd";

const {Text} = Typography;

export type ValueColorOption = { label: React.ReactNode; value: string };

export const ColorMapField: React.FC<{
    extra?: React.ReactNode;
    valueOptions: ValueColorOption[];
    disabled?: boolean;
}> = ({extra, valueOptions, disabled}) => {
    const {t} = useTranslation();
    const normalizedOptions = React.useMemo(() => {
        const map = new Map<string, ValueColorOption>();
        for (const opt of valueOptions ?? []) {
            const v = (opt.value ?? "").trim();
            if (!v) continue;
            if (!map.has(v)) map.set(v, {...opt, value: v});
        }
        return Array.from(map.values());
    }, [valueOptions]);
    const empty = !normalizedOptions.length;
    return (
        <Form.Item
            label={t("attributeConfig.colorMap")}
            extra={
                <>
                    {extra}
                    {empty ? (
                        <div style={{marginTop: 4}}>
                            <Text type="secondary">{t("attributeConfig.colorMapNoOptions")}</Text>
                        </div>
                    ) : null}
                </>
            }
        >
            <Form.List name="valueColorMapRows">
                {(fields, {add, remove}) => (
                    <Space orientation="vertical" style={{width: "100%"}} size="small">
                        {fields.map((field) => {
                            const {key, ...fieldProps} = field;
                            return (
                                <Space key={key} style={{display: "flex"}} align="center">
                                    <Form.Item
                                        {...fieldProps}
                                        name={[field.name, "value"]}
                                        rules={[
                                            {required: true, message: t("attributeConfig.colorMapSelectValue")},
                                            {
                                                validator: async (_, v: unknown) => {
                                                    const vv = typeof v === "string" ? v.trim() : "";
                                                    if (!vv) return;
                                                    if (!normalizedOptions.some((o) => o.value === vv)) {
                                                        throw new Error(t("attributeConfig.colorMapInvalidValue"));
                                                    }
                                                }
                                            }
                                        ]}
                                        style={{marginBottom: 0, width: 240}}
                                    >
                                        <Select
                                            showSearch={{
                                                filterOption: (input, option) => {
                                                    const label = String(option?.label ?? "");
                                                    const value = String(option?.value ?? "");
                                                    const kw = (input ?? "").toLowerCase();
                                                    return (
                                                        label.toLowerCase().includes(kw) ||
                                                        value.toLowerCase().includes(kw)
                                                    );
                                                }
                                            }}
                                            placeholder={t("attributeConfig.colorMapSelectPlaceholder")}
                                            options={normalizedOptions}
                                            disabled={disabled || empty}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        {...fieldProps}
                                        name={[field.name, "color"]}
                                        rules={[{required: true, message: t("attributeConfig.colorMapSelectColor")}]}
                                        style={{marginBottom: 0}}
                                    >
                                        <Form.Item
                                            noStyle
                                            shouldUpdate={(prev, cur) =>
                                                prev?.valueColorMapRows?.[field.name]?.color !==
                                                cur?.valueColorMapRows?.[field.name]?.color
                                            }
                                        >
                                            {({getFieldValue, setFieldValue}) => {
                                                const current =
                                                    (getFieldValue(["valueColorMapRows", field.name, "color"]) as
                                                        | string
                                                        | undefined) || "#1677ff";

                                                return (
                                                    <ColorPicker
                                                        value={current}
                                                        format="hex"
                                                        disabledFormat
                                                        onChange={(value) => {
                                                            setFieldValue(
                                                                ["valueColorMapRows", field.name, "color"],
                                                                value.toHexString()
                                                            );
                                                        }}
                                                    >
                                                        <Button
                                                            style={{
                                                                height: 32,
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: 8
                                                            }}
                                                        >
                              <span
                                  style={{
                                      width: 14,
                                      height: 14,
                                      borderRadius: 3,
                                      background: current,
                                      border: "1px solid rgba(0,0,0,0.15)",
                                      display: "inline-block"
                                  }}
                              />
                                                            <span
                                                                style={{fontFamily: "monospace"}}>{current.toUpperCase()}</span>
                                                        </Button>
                                                    </ColorPicker>
                                                );
                                            }}
                                        </Form.Item>
                                    </Form.Item>

                                    <Button danger onClick={() => remove(field.name)} style={{height: 32}}>
                                        {t("common.delete")}
                                    </Button>
                                </Space>
                            );
                        })}

                        <Button
                            type="dashed"
                            onClick={() => add({value: undefined, color: "#1677ff"})}
                            disabled={disabled || empty}
                        >
                            {t("attributeConfig.colorMapAdd")}
                        </Button>
                    </Space>
                )}
            </Form.List>
        </Form.Item>
    );
};

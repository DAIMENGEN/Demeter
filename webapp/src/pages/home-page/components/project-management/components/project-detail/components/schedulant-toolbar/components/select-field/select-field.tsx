import React from "react";
import {useTranslation} from "react-i18next";
import { Button, Form, Input, Select, Space } from "antd";

export const SelectField: React.FC = () => {
    const {t} = useTranslation();
    return (
        <>
            <Form.Item label={t("attributeConfig.options")} extra={t("attributeConfig.optionsExtra")}>
                <Form.List name="optionsRows">
                    {(fields, { add, remove }) => (
                        <Space orientation="vertical" style={{ width: "100%" }} size="small">
                            {fields.map((field) => {
                                const { key, ...fieldProps } = field;
                                return (
                                    <Space key={key} style={{ display: "flex" }} align="baseline">
                                        <Form.Item
                                            {...fieldProps}
                                            name={[field.name, "label"]}
                                            rules={[{ required: true, message: t("attributeConfig.labelRequired") }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Input placeholder={t("attributeConfig.labelPlaceholder")} />
                                        </Form.Item>
                                        <Form.Item
                                            {...fieldProps}
                                            name={[field.name, "value"]}
                                            rules={[{ required: true, message: t("attributeConfig.valueRequired") }]}
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Input placeholder={t("attributeConfig.valuePlaceholder")} />
                                        </Form.Item>
                                        <Button danger onClick={() => remove(field.name)}>
                                            {t("common.delete")}
                                        </Button>
                                    </Space>
                                );
                            })}
                            <Button type="dashed" onClick={() => add({ label: "", value: "" })}>
                                {t("attributeConfig.addOption")}
                            </Button>
                        </Space>
                    )}
                </Form.List>
            </Form.Item>

            <Form.Item
                noStyle
                shouldUpdate={(prev, cur) => prev.optionsRows !== cur.optionsRows}
            >
                {({ getFieldValue, setFieldValue }) => {
                    const optionsRows = (getFieldValue("optionsRows") as { label: string; value: string }[]) ?? [];
                    const options = optionsRows
                        .map((r) => ({
                            value: (r?.value ?? "").trim(),
                            label: (r?.label ?? "").trim() || (r?.value ?? "").trim()
                        }))
                        .filter((x) => Boolean(x.value));

                    const allowedValues = new Set(options.map((x) => x.value));
                    const currentDefault = (getFieldValue("defaultValue") as string | undefined) ?? undefined;

                    if (currentDefault && !allowedValues.has(currentDefault)) {
                        setFieldValue("defaultValue", undefined);
                    }

                    return (
                        <Form.Item
                            name="defaultValue"
                            label={t("attributeConfig.defaultValue")}
                            extra={t("attributeConfig.defaultValueExtra")}
                        >
                            <Select
                                allowClear
                                placeholder={t("attributeConfig.defaultValueSelectPlaceholder")}
                                options={options}
                            />
                        </Form.Item>
                    );
                }}
            </Form.Item>
        </>
    );
};

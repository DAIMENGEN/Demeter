import React from "react";
import {useTranslation} from "react-i18next";
import {Form, InputNumber} from "antd";

export interface NumberFieldProps {
    disabled?: boolean;
}

export const NumberField: React.FC<NumberFieldProps> = ({disabled}) => {
    const {t} = useTranslation();
    return (
        <Form.Item
            name="defaultValue"
            label={t("attributeConfig.defaultValue")}
            extra={t("attributeConfig.defaultValueStoredAsString")}
            rules={[
                {
                    validator: async (_, value: unknown) => {
                        // 允许不填
                        if (value == null || value === "") return;

                        const n = typeof value === "number" ? value : Number(String(value));
                        if (Number.isNaN(n)) {
                            throw new Error(t("attributeConfig.numberError"));
                        }
                    }
                }
            ]}
            normalize={(v: number | null | undefined) => {
                if (v == null) return undefined;
                return String(v);
            }}
        >
            <InputNumber
                style={{width: "100%"}}
                placeholder={t("attributeConfig.defaultValueInputPlaceholder")}
                disabled={disabled}
                step={0.01}
                controls
                parser={(displayValue) => {
                    const s = (displayValue ?? "").toString().trim();
                    if (!s) return "";
                    return s.replace(/[^0-9+\-.]/g, "");
                }}
            />
        </Form.Item>
    );
};

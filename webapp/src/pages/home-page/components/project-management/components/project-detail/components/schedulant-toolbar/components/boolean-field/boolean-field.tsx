import React from "react";
import {useTranslation} from "react-i18next";
import {Form, Select} from "antd";

export interface BooleanFieldProps {
    disabled?: boolean;
}

export const BooleanField: React.FC<BooleanFieldProps> = ({disabled}) => {
    const {t} = useTranslation();

    const booleanOptions = [
        {label: t("attributeConfig.yes"), value: "true"},
        {label: t("attributeConfig.no"), value: "false"}
    ];

    return (
        <Form.Item
            name="defaultValue"
            label={t("attributeConfig.defaultValue")}
            extra={t("attributeConfig.defaultValueBooleanExtra")}
            rules={[
                {
                    validator: async (_, value: unknown) => {
                        // 允许不填
                        if (value == null || value === "") return;
                        const s = String(value);
                        if (s !== "true" && s !== "false") {
                            throw new Error(t("attributeConfig.booleanOnlyError"));
                        }
                    }
                }
            ]}
        >
            <Select
                allowClear
                placeholder={t("attributeConfig.defaultValueSelectPlaceholder")}
                options={booleanOptions}
                disabled={disabled}
            />
        </Form.Item>
    );
};


import React from "react";
import {useTranslation} from "react-i18next";
import {Form, Input} from "antd";

export interface TextFieldProps {
    disabled?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({disabled}) => {
    const {t} = useTranslation();
    return (
        <Form.Item
            name="defaultValue"
            label={t("attributeConfig.defaultValue")}
            extra={t("attributeConfig.defaultValueStoredAsString")}
        >
            <Input.TextArea
                placeholder={t("attributeConfig.defaultValueInputPlaceholder")}
                disabled={disabled}
                autoSize={{minRows: 3, maxRows: 10}}
                allowClear
            />
        </Form.Item>
    );
};


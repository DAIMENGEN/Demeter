import React from "react";
import {useTranslation} from "react-i18next";
import {DatePicker, Form} from "antd";
import dayjs, {type Dayjs} from "dayjs";

export const DateField: React.FC<{ mode: "date" | "datetime" }> = ({ mode }) => {
    const {t} = useTranslation();
    return (
        <Form.Item
            label={t("attributeConfig.defaultValue")}
            name="defaultValue"
            getValueProps={(value: string | undefined) => {
                if (!value) return { value: null };
                const d = dayjs(value);
                return { value: d.isValid() ? d : null };
            }}
            getValueFromEvent={(v: Dayjs | null) => {
                if (!v) return undefined;
                return mode === "date" ? v.format("YYYY-MM-DD") : v.format("YYYY-MM-DDTHH:mm:ss");
            }}
            extra={mode === "date" ? t("attributeConfig.dateExtra") : t("attributeConfig.datetimeExtra")}
        >
            <DatePicker
                style={{ width: "100%" }}
                showTime={mode === "datetime"}
                allowClear
            />
        </Form.Item>
    );
};

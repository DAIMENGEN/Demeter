import React from "react";
import {Form, Select} from "antd";

export interface BooleanTypeFieldsProps {
    disabled?: boolean;
}

const booleanOptions = [
    {label: "是", value: "true"},
    {label: "否", value: "false"}
];

export const BooleanTypeFields: React.FC<BooleanTypeFieldsProps> = ({disabled}) => {
    return (
        <Form.Item
            name="defaultValue"
            label="默认值"
            extra="可选。新建任务时，如果该字段未填写，将自动使用默认值。保存时会以字符串（true/false）存储。"
            rules={[
                {
                    validator: async (_, value: unknown) => {
                        // 允许不填
                        if (value == null || value === "") return;
                        const s = String(value);
                        if (s !== "true" && s !== "false") {
                            throw new Error("默认值只能为 true 或 false");
                        }
                    }
                }
            ]}
        >
            <Select
                allowClear
                placeholder="请选择默认值"
                options={booleanOptions}
                disabled={disabled}
            />
        </Form.Item>
    );
};


import React from "react";
import {Form, Input} from "antd";

export interface TextTypeFieldsProps {
    disabled?: boolean;
}

export const TextTypeFields: React.FC<TextTypeFieldsProps> = ({disabled}) => {
    return (
        <Form.Item
            name="defaultValue"
            label="默认值"
            extra="可选。新建任务时，如果该字段未填写，将自动使用默认值。保存时会以字符串存储。"
        >
            <Input.TextArea
                placeholder="请输入默认值"
                disabled={disabled}
                autoSize={{minRows: 3, maxRows: 10}}
                allowClear
            />
        </Form.Item>
    );
};


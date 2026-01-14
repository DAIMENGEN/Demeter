import React from "react";
import {Form, InputNumber} from "antd";

export interface NumberTypeFieldsProps {
    disabled?: boolean;
}

export const NumberTypeFields: React.FC<NumberTypeFieldsProps> = ({disabled}) => {
    return (
        <Form.Item
            name="defaultValue"
            label="默认值"
            extra="可选。新建任务时，如果该字段未填写，将自动使用默认值。保存时会以字符串存储。"
            rules={[
                {
                    validator: async (_, value: unknown) => {
                        // 允许不填
                        if (value == null || value === "") return;

                        // 这里 value 理论上是 string（由 normalize 写回），但为了稳妥做一次兼容
                        const n = typeof value === "number" ? value : Number(String(value));
                        if (Number.isNaN(n)) {
                            throw new Error("请输入合法的数字");
                        }
                    }
                }
            ]}
            // 把 InputNumber 的 number/null 统一转成 string/undefined，写回到 defaultValue
            normalize={(v: number | null | undefined) => {
                if (v == null) return undefined;
                // 统一用字符串存储（后端也是 string | null）
                return String(v);
            }}
        >
            <InputNumber
                style={{width: "100%"}}
                placeholder="请输入默认值"
                disabled={disabled}
                // 支持整数/小数输入
                step={0.01}
                controls
                // 让 InputNumber 可以正确回显 string
                parser={(displayValue) => {
                    const s = (displayValue ?? "").toString().trim();
                    if (!s) return "";
                    // 移除千分位或其它非数字字符，仅保留 + - . 和数字
                    return s.replace(/[^0-9+\-.]/g, "");
                }}
            />
        </Form.Item>
    );
};

import React from "react";
import { Button, Form, Input, Space } from "antd";

export const SelectTypeFields: React.FC = () => {
  return (
    <Form.Item label="选项" extra="仅用于 select 类型。逐条填写 label/value。">
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
                    rules={[{ required: true, message: "请输入 label" }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="label（显示）" />
                  </Form.Item>
                  <Form.Item
                    {...fieldProps}
                    name={[field.name, "value"]}
                    rules={[{ required: true, message: "请输入 value" }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input placeholder="value（存储）" />
                  </Form.Item>
                  <Button danger onClick={() => remove(field.name)}>
                    删除
                  </Button>
                </Space>
              );
            })}
            <Button type="dashed" onClick={() => add({ label: "", value: "" })}>
              添加选项
            </Button>
          </Space>
        )}
      </Form.List>
    </Form.Item>
  );
};


import React from "react";
import { Button, Form, Input, Select, Space } from "antd";

export const SelectTypeFields: React.FC = () => {
  return (
    <>
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

          // 选项变更时，如果默认值已不在选项中，自动清空，避免保存非法值
          if (currentDefault && !allowedValues.has(currentDefault)) {
            setFieldValue("defaultValue", undefined);
          }

          return (
            <Form.Item
              name="defaultValue"
              label="默认值"
              extra="可选。新建任务时，如果该字段未填写，将自动使用默认值。"
            >
              <Select
                allowClear
                placeholder="请选择默认值"
                options={options}
              />
            </Form.Item>
          );
        }}
      </Form.Item>
    </>
  );
};

import React from "react";
import { DatePicker, Form } from "antd";
import dayjs, { type Dayjs } from "dayjs";

/**
 * Date/DateTime 默认值配置：
 * - 表单字段仍然复用 defaultValue（string），与其他类型一致
 * - UI 使用 DatePicker，内部负责 string <-> Dayjs 的转换
 */
export const DateTypeFields: React.FC<{ mode: "date" | "datetime" }> = ({ mode }) => {
  return (
    <Form.Item
      label="默认值"
      name="defaultValue"
      // 让 Form 成为数据源，避免 DatePicker 受控 value 来回被覆盖导致“自动清空”
      getValueProps={(value: string | undefined) => {
        if (!value) return { value: null };
        const d = dayjs(value);
        return { value: d.isValid() ? d : null };
      }}
      // DatePicker onChange 返回 Dayjs | null；这里统一转成 string 存到表单
      getValueFromEvent={(v: Dayjs | null) => {
        if (!v) return undefined;
        return mode === "date" ? v.format("YYYY-MM-DD") : v.toISOString();
      }}
      extra={
        mode === "date"
          ? "可选。保存到后端时统一按 string 存储（date: YYYY-MM-DD）。"
          : "可选。保存到后端时统一按 string 存储（datetime: ISO）。"
      }
    >
      <DatePicker
        style={{ width: "100%" }}
        showTime={mode === "datetime"}
        allowClear
        // 重要：不要在这里手动 value/onChange 控制，让 Form.Item 接管
      />
    </Form.Item>
  );
};

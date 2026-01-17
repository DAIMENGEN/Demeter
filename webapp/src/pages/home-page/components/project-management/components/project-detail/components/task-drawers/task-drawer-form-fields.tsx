import React from "react";
import {DatePicker, Form, Input, InputNumber, Select} from "antd";
import type {Dayjs} from "dayjs";

export interface TaskDrawerFormFieldsProps {
    parentOptions: Array<{ value: string; label: string }>;
    taskTypeOptions: Array<{ value: number; label: string }>;
}

export const TaskDrawerFormFields: React.FC<TaskDrawerFormFieldsProps> = ({
    parentOptions,
    taskTypeOptions
}) => {
    return (
        <>
            <Form.Item
                label="任务名称"
                name="taskName"
                rules={[{required: true, message: "请输入任务名称"}]}
            >
                <Input placeholder="请输入任务名称" allowClear/>
            </Form.Item>

            <Form.Item label="父任务" name="parentId">
                <Select
                    placeholder="可选"
                    allowClear
                    options={parentOptions}
                    showSearch={{
                        optionFilterProp: "label"
                    }}
                />
            </Form.Item>

            <Form.Item
                label="任务类型"
                name="taskType"
                rules={[{required: true, message: "请选择任务类型"}]}
            >
                <Select options={taskTypeOptions}/>
            </Form.Item>

            <Form.Item
                label="时间范围"
                name="dateRange"
                rules={[
                    {
                        validator: async (_rule, value: [Dayjs | null, Dayjs | null] | null | undefined) => {
                            const start = value?.[0] ?? null;
                            const end = value?.[1] ?? null;
                            if (!start || !end) {
                                throw new Error("请选择开始时间和结束时间");
                            }
                            if (end.isBefore(start)) {
                                throw new Error("结束时间不能早于开始时间");
                            }
                        }
                    }
                ]}
            >
                <DatePicker.RangePicker
                    style={{width: "100%"}}
                    placeholder={["开始时间", "结束时间"]}
                />
            </Form.Item>

            <Form.Item label="排序" name="order">
                <InputNumber
                    placeholder="可选"
                    style={{width: "100%"}}
                    step={0.1}
                    precision={2}
                    stringMode={false}
                />
            </Form.Item>
        </>
    );
};

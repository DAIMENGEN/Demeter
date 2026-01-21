import React from "react";
import {DatePicker, Form, Input, InputNumber, Select} from "antd";
import type {Dayjs} from "dayjs";
import {ProjectTaskType} from "@Webapp/api/modules/project";

export interface TaskDrawerFormFieldsProps {
    parentOptions: Array<{ value: string; label: string }>;
    hideTaskType?: boolean;
}

export const TaskDrawerFormFields: React.FC<TaskDrawerFormFieldsProps> = ({
    parentOptions,
    hideTaskType = false
}) => {
    const form = Form.useFormInstance();
    const taskType = Form.useWatch("taskType", form);

    const isSingleDateType = taskType === ProjectTaskType.CHECKPOINT || taskType === ProjectTaskType.MILESTONE;

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
                hidden={hideTaskType}
                rules={[{required: true, message: "请选择任务类型"}]}
            >
                <Select
                    options={[
                        {value: ProjectTaskType.UNKNOWN, label: "未知"},
                        {value: ProjectTaskType.DEFAULT, label: "普通任务"},
                        {value: ProjectTaskType.MILESTONE, label: "里程碑"},
                        {value: ProjectTaskType.CHECKPOINT, label: "检查点"}
                    ]}
                    onChange={(value) => {
                        const isSingle = value === ProjectTaskType.CHECKPOINT || value === ProjectTaskType.MILESTONE;
                        const currentRange = form.getFieldValue("dateRange") as [Dayjs, Dayjs] | undefined;

                        if (isSingle && currentRange?.[0]) {
                            // 切换到单日期类型时，将结束日期设置为开始日期
                            form.setFieldValue("dateRange", [currentRange[0], currentRange[0]]);
                        }
                    }}
                />
            </Form.Item>

            {isSingleDateType ? (
                <Form.Item
                    label="日期"
                    name="dateRange"
                    required
                    rules={[
                        {
                            required: true,
                            validator: async (_rule, value: [Dayjs | null, Dayjs | null] | null | undefined) => {
                                const date = value?.[0] ?? null;
                                if (!date) {
                                    throw new Error("请选择日期");
                                }
                            }
                        }
                    ]}
                    getValueFromEvent={(date: Dayjs | null) => {
                        // 单日期选择器返回 Dayjs 对象，转换为 [Dayjs, Dayjs] 格式
                        return date ? [date, date] : undefined;
                    }}
                    getValueProps={(value: [Dayjs, Dayjs] | undefined) => {
                        // 从 [Dayjs, Dayjs] 格式提取第一个日期用于显示
                        return {value: value?.[0] ?? null};
                    }}
                >
                    <DatePicker
                        style={{width: "100%"}}
                        placeholder="请选择日期"
                    />
                </Form.Item>
            ) : (
                <Form.Item
                    label="时间范围"
                    name="dateRange"
                    required
                    rules={[
                        {
                            required: true,
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
            )}

            <Form.Item
                label="排序"
                name="order"
                rules={[{required: true, message: "请输入排序值"}]}
            >
                <InputNumber
                    placeholder="请输入排序值"
                    style={{width: "100%"}}
                    step={0.1}
                    precision={2}
                    stringMode={false}
                />
            </Form.Item>
        </>
    );
};

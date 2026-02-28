import React from "react";
import {DatePicker, Form, Input, InputNumber, Select} from "antd";
import type {Dayjs} from "dayjs";
import {useTranslation} from "react-i18next";
import {ProjectTaskType} from "@Webapp/api/modules/project";

export interface TaskDrawerFormFieldsProps {
    parentOptions: Array<{ value: string; label: string }>;
    hideTaskType?: boolean;
}

export const FormFields: React.FC<TaskDrawerFormFieldsProps> = ({
    parentOptions,
    hideTaskType = false
}) => {
    const form = Form.useFormInstance();
    const {t} = useTranslation();
    const taskType = Form.useWatch("taskType", form);

    const isSingleDateType = taskType === ProjectTaskType.CHECKPOINT || taskType === ProjectTaskType.MILESTONE;

    return (
        <>
            <Form.Item
                label={t("task.taskName")}
                name="taskName"
                rules={[{required: true, message: t("task.taskNameRequired")}]}
            >
                <Input placeholder={t("task.taskNamePlaceholder")} allowClear/>
            </Form.Item>

            <Form.Item label={t("task.parentTask")} name="parentId">
                <Select
                    placeholder={t("task.parentTaskPlaceholder")}
                    allowClear
                    options={parentOptions}
                    showSearch={{
                        optionFilterProp: "label"
                    }}
                />
            </Form.Item>

            <Form.Item
                label={t("task.taskType")}
                name="taskType"
                hidden={hideTaskType}
                rules={[{required: true, message: t("task.taskTypeRequired")}]}
            >
                <Select
                    options={[
                        {value: ProjectTaskType.UNKNOWN, label: t("task.taskTypeUnknown")},
                        {value: ProjectTaskType.DEFAULT, label: t("task.taskTypeDefault")},
                        {value: ProjectTaskType.MILESTONE, label: t("task.taskTypeMilestone")},
                        {value: ProjectTaskType.CHECKPOINT, label: t("task.taskTypeCheckpoint")}
                    ]}
                    onChange={(value) => {
                        const isSingle = value === ProjectTaskType.CHECKPOINT || value === ProjectTaskType.MILESTONE;
                        const currentRange = form.getFieldValue("dateRange") as [Dayjs, Dayjs] | undefined;

                        if (isSingle && currentRange?.[0]) {
                            form.setFieldValue("dateRange", [currentRange[0], currentRange[0]]);
                        }
                    }}
                />
            </Form.Item>

            {isSingleDateType ? (
                <Form.Item
                    label={t("task.date")}
                    name="dateRange"
                    required
                    rules={[
                        {
                            required: true,
                            validator: async (_rule, value: [Dayjs | null, Dayjs | null] | null | undefined) => {
                                const date = value?.[0] ?? null;
                                if (!date) {
                                    throw new Error(t("task.dateRequired"));
                                }
                            }
                        }
                    ]}
                    getValueFromEvent={(date: Dayjs | null) => {
                        return date ? [date, date] : undefined;
                    }}
                    getValueProps={(value: [Dayjs, Dayjs] | undefined) => {
                        return {value: value?.[0] ?? null};
                    }}
                >
                    <DatePicker
                        style={{width: "100%"}}
                        placeholder={t("task.datePlaceholder")}
                    />
                </Form.Item>
            ) : (
                <Form.Item
                    label={t("task.dateRange")}
                    name="dateRange"
                    required
                    rules={[
                        {
                            required: true,
                            validator: async (_rule, value: [Dayjs | null, Dayjs | null] | null | undefined) => {
                                const start = value?.[0] ?? null;
                                const end = value?.[1] ?? null;
                                if (!start || !end) {
                                    throw new Error(t("task.dateRangeRequired"));
                                }
                                if (end.isBefore(start)) {
                                    throw new Error(t("task.dateRangeInvalid"));
                                }
                            }
                        }
                    ]}
                >
                    <DatePicker.RangePicker
                        style={{width: "100%"}}
                        placeholder={[t("task.dateRangeStart"), t("task.dateRangeEnd")]}
                    />
                </Form.Item>
            )}

            <Form.Item
                label={t("task.order")}
                name="order"
                rules={[{required: true, message: t("task.orderRequired")}]}
            >
                <InputNumber
                    placeholder={t("task.orderPlaceholder")}
                    style={{width: "100%"}}
                    step={0.1}
                    precision={2}
                    stringMode={false}
                />
            </Form.Item>
        </>
    );
};

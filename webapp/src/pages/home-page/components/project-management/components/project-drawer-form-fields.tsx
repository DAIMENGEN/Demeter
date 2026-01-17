import React from "react";
import {DatePicker, Form, Input, InputNumber, Select} from "antd";
import type {Dayjs} from "dayjs";
import {getProjectStatusOptions} from "./project-drawer-utils.ts";

const {TextArea} = Input;
const {RangePicker} = DatePicker;

export interface ProjectDrawerFormFieldsProps {
    statusOptions?: { label: string; value: number }[];
}

export const ProjectDrawerFormFields: React.FC<ProjectDrawerFormFieldsProps> = ({statusOptions}) => {
    const options = statusOptions ?? getProjectStatusOptions();

    return (
        <>
            <Form.Item
                name="projectName"
                label="项目名称"
                rules={[
                    {required: true, message: "请输入项目名称"},
                    {max: 100, message: "项目名称不能超过100个字符"}
                ]}
            >
                <Input placeholder="请输入项目名称"/>
            </Form.Item>

            <Form.Item
                name="description"
                label="项目描述"
                rules={[{max: 500, message: "项目描述不能超过500个字符"}]}
            >
                <TextArea
                    rows={4}
                    placeholder="请输入项目描述（可选）"
                    showCount
                    maxLength={500}
                />
            </Form.Item>

            <Form.Item
                name="dateRange"
                label="项目时间"
                rules={[
                    {
                        validator: async (_rule, value: [Dayjs | null, Dayjs | null] | null | undefined) => {
                            const start = value?.[0] ?? null;
                            const end = value?.[1] ?? null;
                            if (!start) {
                                throw new Error("请选择项目开始时间");
                            }
                            if (end && end.isBefore(start)) {
                                throw new Error("结束时间不能早于开始时间");
                            }
                        }
                    }
                ]}
            >
                <RangePicker
                    allowEmpty={[false, true]}
                    style={{width: "100%"}}
                    placeholder={["开始时间", "结束时间（可选）"]}
                />
            </Form.Item>

            <Form.Item
                name="projectStatus"
                label="项目状态"
                rules={[{required: true, message: "请选择项目状态"}]}
            >
                <Select placeholder="请选择项目状态" options={options}/>
            </Form.Item>

            <Form.Item name="order" label="排序序号" tooltip="数字越小，排序越靠前">
                <InputNumber
                    placeholder="请输入排序序号（可选）"
                    min={0}
                    precision={0}
                    style={{width: "100%"}}
                />
            </Form.Item>
        </>
    );
};

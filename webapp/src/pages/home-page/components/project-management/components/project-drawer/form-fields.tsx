import React from "react";
import {DatePicker, Form, Input, Select} from "antd";
import type {Dayjs} from "dayjs";
import {useTranslation} from "react-i18next";
import {getProjectStatusOptions} from "@Webapp/api/modules/project/utils.ts";

const {TextArea} = Input;
const {RangePicker} = DatePicker;

export interface ProjectDrawerFormFieldsProps {
    statusOptions?: { label: string; value: number }[];
}

export const ProjectDrawerFormFields: React.FC<ProjectDrawerFormFieldsProps> = ({statusOptions}) => {
    const {t} = useTranslation();
    const options = statusOptions ?? getProjectStatusOptions(t);

    return (
        <>
            <Form.Item
                name="projectName"
                label={t("project.projectName")}
                rules={[
                    {required: true, message: t("project.projectNameRequired")},
                    {max: 100, message: t("project.projectNameMaxLength")}
                ]}
            >
                <Input placeholder={t("project.projectNamePlaceholder")}/>
            </Form.Item>

            <Form.Item
                name="description"
                label={t("project.description")}
                rules={[{max: 500, message: t("project.descriptionMaxLength")}]}
            >
                <TextArea
                    rows={4}
                    placeholder={t("project.descriptionPlaceholder")}
                    showCount
                    maxLength={500}
                />
            </Form.Item>

            <Form.Item
                name="dateRange"
                label={t("project.dateRange")}
                rules={[
                    {
                        validator: async (_rule, value: [Dayjs | null, Dayjs | null] | null | undefined) => {
                            const start = value?.[0] ?? null;
                            const end = value?.[1] ?? null;
                            if (!start) {
                                throw new Error(t("project.startTimeRequired"));
                            }
                            if (end && end.isBefore(start)) {
                                throw new Error(t("project.endTimeBeforeStart"));
                            }
                        }
                    }
                ]}
            >
                <RangePicker
                    allowEmpty={[false, true]}
                    style={{width: "100%"}}
                    placeholder={[t("project.startTime"), t("project.endTime")]}
                />
            </Form.Item>

            <Form.Item
                name="projectStatus"
                label={t("project.status")}
                rules={[{required: true, message: t("project.statusRequired")}]}
            >
                <Select placeholder={t("project.statusPlaceholder")} options={options}/>
            </Form.Item>
        </>
    );
};

import React, {useCallback, useMemo} from "react";
import {Button, Drawer, Form, Space} from "antd";
import type {Dayjs} from "dayjs";
import dayjs from "dayjs";
import {useTranslation} from "react-i18next";
import {useProjectActions} from "@Webapp/api/modules/project";
import type {CreateProjectParams} from "@Webapp/api/modules/project/types.ts";
import {ProjectStatus} from "@Webapp/api/modules/project/types.ts";
import "./create-project-drawer.scss";
import {ProjectDrawerFormFields} from "../form-fields.tsx";
import {toNaiveDateTimeString} from "../utils.ts";

const INITIAL_FORM_VALUES = {
    projectStatus: ProjectStatus.PLANNING
};

export interface CreateProjectDrawerProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const CreateProjectDrawer: React.FC<CreateProjectDrawerProps> = ({
                                                                            open,
                                                                            onClose,
                                                                            onSuccess
                                                                        }) => {
    const [form] = Form.useForm();
    const {t} = useTranslation();
    const {createProject, loading} = useProjectActions();

    const handleSubmit = useCallback(async () => {
        try {
            const values = await form.validateFields();
            const [startDate, endDate] = (values.dateRange ?? []) as [Dayjs | null | undefined, Dayjs | null | undefined];

            const params: CreateProjectParams = {
                projectName: values.projectName,
                description: values.description,
                startDateTime: startDate ? toNaiveDateTimeString(startDate) : toNaiveDateTimeString(dayjs()),
                endDateTime: endDate ? toNaiveDateTimeString(endDate) : undefined,
                projectStatus: values.projectStatus || ProjectStatus.PLANNING
            };

            await createProject(params);
            form.resetFields();
            onClose();
            onSuccess?.();
        } catch (error) {
            // 表单验证失败或创建失败，错误已在 hook 中处理
            console.error("创建项目失败:", error);
        }
    }, [form, createProject, onClose, onSuccess]);

    const handleCancel = useCallback(() => {
        form.resetFields();
        onClose();
    }, [form, onClose]);

    const footer = useMemo(() => (
        <div className="drawer-footer">
            <Space>
                <Button onClick={handleCancel}>{t("common.cancel")}</Button>
                <Button type="primary" onClick={handleSubmit} loading={loading}>
                    {t("common.submit")}
                </Button>
            </Space>
        </div>
    ), [handleCancel, handleSubmit, loading, t]);

    return (
        <Drawer
            title={t("project.createProject")}
            placement="right"
            onClose={handleCancel}
            open={open}
            resizable
            size={500}
            classNames={{
                body: "create-project-drawer-body"
            }}
            footer={footer}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={INITIAL_FORM_VALUES}
            >
                <ProjectDrawerFormFields/>
            </Form>
        </Drawer>
    );
};

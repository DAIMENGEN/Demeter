import React, {useCallback, useEffect, useMemo} from "react";
import {Button, Drawer, Form, Space} from "antd";
import type {Dayjs} from "dayjs";
import dayjs from "dayjs";
import {useTranslation} from "react-i18next";
import {useProjectActions} from "@Webapp/api/modules/project";
import type {Project, UpdateProjectParams} from "@Webapp/api/modules/project/types.ts";
import "./edit-project-drawer.scss";
import {ProjectDrawerFormFields} from "../form-fields.tsx";
import {parseOptionalNonNegativeInteger, toNaiveDateTimeString} from "../utils.ts";

export interface EditProjectDrawerProps {
    open: boolean;
    project: Project | null;
    onClose: () => void;
    onSuccess?: () => void;
}

export const EditProjectDrawer: React.FC<EditProjectDrawerProps> = ({
                                                                        open,
                                                                        project,
                                                                        onClose,
                                                                        onSuccess
                                                                    }) => {
    const [form] = Form.useForm();
    const {t} = useTranslation();
    const {updateProject, loading} = useProjectActions();

    // 当项目数据变化时，更新表单；当抽屉关闭时，重置表单
    useEffect(() => {
        if (open && project) {
            form.setFieldsValue({
                projectName: project.projectName,
                description: project.description,
                dateRange: [
                    project.startDateTime ? dayjs(project.startDateTime) : null,
                    project.endDateTime ? dayjs(project.endDateTime) : null
                ],
                projectStatus: project.projectStatus,
                order: project.order
            });
        } else if (!open) {
            form.resetFields();
        }
    }, [open, project, form]);

    const handleSubmit = useCallback(async () => {
        if (!project) return;

        try {
            const values = await form.validateFields();
            const [startDate, endDate] = (values.dateRange ?? []) as [Dayjs | null | undefined, Dayjs | null | undefined];

            const params: UpdateProjectParams = {
                projectName: values.projectName,
                description: values.description,
                startDateTime: startDate ? toNaiveDateTimeString(startDate) : undefined,
                endDateTime: endDate ? toNaiveDateTimeString(endDate) : undefined,
                projectStatus: values.projectStatus,
                order: parseOptionalNonNegativeInteger(values.order)
            };

            await updateProject(project.id, params);
            onClose();
            onSuccess?.();
        } catch (error) {
            // 表单验证失败或更新失败，错误已在 hook 中处理
            console.error("更新项目失败:", error);
        }
    }, [project, form, updateProject, onClose, onSuccess]);

    const handleCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    const footer = useMemo(() => (
        <div className="drawer-footer">
            <Space>
                <Button onClick={handleCancel} disabled={loading}>{t("common.cancel")}</Button>
                <Button type="primary" onClick={handleSubmit} loading={loading}>
                    {t("common.save")}
                </Button>
            </Space>
        </div>
    ), [handleCancel, handleSubmit, loading, t]);

    return (
        <Drawer
            title={t("project.editProject")}
            placement="right"
            onClose={handleCancel}
            open={open}
            forceRender
            size={500}
            resizable
            loading={loading}
            classNames={{
                body: "edit-project-drawer-body"
            }}
            footer={footer}
        >
            <Form
                form={form}
                layout="vertical"
            >
                <ProjectDrawerFormFields/>
            </Form>
        </Drawer>
    );
};

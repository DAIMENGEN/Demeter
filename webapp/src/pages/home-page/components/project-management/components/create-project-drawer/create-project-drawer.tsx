import React from "react";
import {Button, Drawer, Form, Space} from "antd";
import type {Dayjs} from "dayjs";
import dayjs from "dayjs";
import {useCreateProject} from "@Webapp/api/modules/project";
import type {CreateProjectParams} from "@Webapp/api/modules/project/types.ts";
import {ProjectStatus} from "@Webapp/api/modules/project/types.ts";
import "./create-project-drawer.scss";
import {ProjectDrawerFormFields} from "../project-drawer-form-fields.tsx";
import {parseOptionalNonNegativeInteger, toNaiveDateTimeString} from "../project-drawer-utils.ts";

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
    const {createProject, loading} = useCreateProject();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const [startDate, endDate] = (values.dateRange ?? []) as [Dayjs | null | undefined, Dayjs | null | undefined];

            const params: CreateProjectParams = {
                projectName: values.projectName,
                description: values.description,
                startDateTime: startDate ? toNaiveDateTimeString(startDate) : toNaiveDateTimeString(dayjs()),
                endDateTime: endDate ? toNaiveDateTimeString(endDate) : undefined,
                projectStatus: values.projectStatus || ProjectStatus.PLANNING,
                order: parseOptionalNonNegativeInteger(values.order)
            };

            await createProject(params);
            form.resetFields();
            onClose();
            onSuccess?.();
        } catch (error) {
            // 表单验证失败或创建失败，错误已在 hook 中处理
            console.error("创建项目失败:", error);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Drawer
            title="创建项目"
            placement="right"
            onClose={handleCancel}
            open={open}
            resizable
            size={500}
            classNames={{
                body: "create-project-drawer-body"
            }}
            footer={
                <div className="drawer-footer">
                    <Space>
                        <Button onClick={handleCancel}>取消</Button>
                        <Button type="primary" onClick={handleSubmit} loading={loading}>
                            创建
                        </Button>
                    </Space>
                </div>
            }
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    projectStatus: ProjectStatus.PLANNING
                }}
            >
                <ProjectDrawerFormFields/>
            </Form>
        </Drawer>
    );
};

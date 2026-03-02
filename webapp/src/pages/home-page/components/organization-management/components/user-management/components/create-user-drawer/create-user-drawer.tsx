import React, {useEffect} from "react";
import {useTranslation} from "react-i18next";
import {App, Button, Form, Input, Select, Space, Switch} from "antd";
import {ResizableDrawer} from "@Webapp/components";
import type {Department} from "@Webapp/api/modules/organization/department";
import type {Team} from "@Webapp/api/modules/organization/team";
import {useUserActions} from "@Webapp/api/modules/user";

interface CreateUserDrawerProps {
    open: boolean;
    departments: Department[];
    teams: Team[];
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateUserDrawer: React.FC<CreateUserDrawerProps> = ({
    open,
    departments,
    teams,
    onClose,
    onSuccess,
}) => {
    const {t} = useTranslation();
    const {message} = App.useApp();
    const [form] = Form.useForm();
    const {loading, createUser} = useUserActions();

    useEffect(() => {
        if (!open) {
            form.resetFields();
        }
    }, [open, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            await createUser({
                username: values.username,
                password: values.password,
                fullName: values.fullName,
                email: values.email,
                phone: values.phone || undefined,
                departmentId: values.departmentId || undefined,
                teamIds: values.teamIds?.length ? values.teamIds : undefined,
                isActive: values.isActive ?? true,
            });
            message.success(t("userManagement.createSuccess"));
            onSuccess();
            onClose();
        } catch (e: unknown) {
            const err = e as {name?: string; message?: string};
            if (err?.name) return; // antd validation error
            message.error(err?.message || t("userManagement.createFailed"));
        }
    };

    return (
        <ResizableDrawer
            title={t("userManagement.createUser")}
            open={open}
            onClose={onClose}
            footer={
                <Space style={{display: "flex", justifyContent: "flex-end"}}>
                    <Button onClick={onClose}>{t("common.cancel")}</Button>
                    <Button type="primary" onClick={handleSubmit} loading={loading}>
                        {t("common.confirm")}
                    </Button>
                </Space>
            }
        >
            <Form
                form={form}
                layout="vertical"
                disabled={loading}
                initialValues={{isActive: true}}
            >
                <Form.Item
                    name="username"
                    label={t("userManagement.username")}
                    rules={[
                        {required: true, message: t("userManagement.usernameRequired")},
                        {min: 3, message: t("userManagement.usernameMinLength")},
                    ]}
                >
                    <Input placeholder={t("userManagement.usernamePlaceholder")} allowClear />
                </Form.Item>

                <Form.Item
                    name="fullName"
                    label={t("userManagement.fullName")}
                    rules={[{required: true, message: t("userManagement.fullNameRequired")}]}
                >
                    <Input placeholder={t("userManagement.fullNamePlaceholder")} allowClear />
                </Form.Item>

                <Form.Item
                    name="email"
                    label={t("userManagement.email")}
                    rules={[
                        {required: true, message: t("userManagement.emailRequired")},
                        {type: "email", message: t("userManagement.emailInvalid")},
                    ]}
                >
                    <Input placeholder={t("userManagement.emailPlaceholder")} allowClear />
                </Form.Item>

                <Form.Item
                    name="password"
                    label={t("userManagement.password")}
                    rules={[
                        {required: true, message: t("userManagement.passwordRequired")},
                        {min: 8, message: t("userManagement.passwordMinLength")},
                    ]}
                >
                    <Input.Password placeholder={t("userManagement.passwordPlaceholder")} />
                </Form.Item>

                <Form.Item name="phone" label={t("userManagement.phone")}>
                    <Input placeholder={t("userManagement.phonePlaceholder")} allowClear />
                </Form.Item>

                <Form.Item name="departmentId" label={t("userManagement.department")}>
                    <Select
                        placeholder={t("userManagement.departmentPlaceholder")}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        options={departments.map((d) => ({
                            value: d.id,
                            label: d.departmentName,
                        }))}
                    />
                </Form.Item>

                <Form.Item name="teamIds" label={t("userManagement.team")}>
                    <Select
                        mode="multiple"
                        placeholder={t("userManagement.teamPlaceholder")}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        options={teams.map((t) => ({
                            value: t.id,
                            label: t.teamName,
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    name="isActive"
                    label={t("userManagement.status")}
                    valuePropName="checked"
                >
                    <Switch
                        checkedChildren={t("userManagement.active")}
                        unCheckedChildren={t("userManagement.inactive")}
                    />
                </Form.Item>
            </Form>
        </ResizableDrawer>
    );
};

import React, {useEffect} from "react";
import {useTranslation} from "react-i18next";
import {App, Button, Form, Input, Select, Space, Switch, Typography} from "antd";
import {ResizableDrawer} from "@Webapp/components";
import type {Department} from "@Webapp/api/modules/organization/department";
import type {Team} from "@Webapp/api/modules/organization/team";
import type {User} from "@Webapp/api/modules/user";
import {useUserActions} from "@Webapp/api/modules/user";

const {Text} = Typography;

interface EditUserDrawerProps {
    open: boolean;
    user: User | null;
    departments: Department[];
    teams: Team[];
    onClose: () => void;
    onSuccess: () => void;
}

export const EditUserDrawer: React.FC<EditUserDrawerProps> = ({
    open,
    user,
    departments,
    teams,
    onClose,
    onSuccess,
}) => {
    const {t} = useTranslation();
    const {message, modal} = App.useApp();
    const [form] = Form.useForm();
    const {loading, updateUser, resetPassword} = useUserActions();

    useEffect(() => {
        if (open && user) {
            form.setFieldsValue({
                fullName: user.fullName,
                email: user.email,
                phone: user.phone ?? "",
                departmentId: user.departmentId || undefined,
                teamIds: user.teamIds?.length ? user.teamIds : [],
                isActive: user.isActive,
            });
        }
        if (!open) {
            form.resetFields();
        }
    }, [open, user, form]);

    const handleSubmit = async () => {
        if (!user) return;
        try {
            const values = await form.validateFields();
            await updateUser(user.id, {
                fullName: values.fullName,
                email: values.email,
                phone: values.phone || undefined,
                departmentId: values.departmentId || null,
                teamIds: values.teamIds ?? [],
                isActive: values.isActive,
            });
            message.success(t("userManagement.updateSuccess"));
            onSuccess();
            onClose();
        } catch (e: unknown) {
            const err = e as {name?: string; message?: string};
            if (err?.name) return;
            message.error(err?.message || t("userManagement.updateFailed"));
        }
    };

    const handleResetPassword = () => {
        if (!user) return;
        modal.confirm({
            title: t("userManagement.resetPasswordConfirmTitle"),
            content: t("userManagement.resetPasswordConfirm", {name: user.fullName}),
            okText: t("common.confirm"),
            cancelText: t("common.cancel"),
            okType: "danger",
            onOk: async () => {
                try {
                    const result = await resetPassword(user.id);
                    modal.success({
                        title: t("userManagement.resetPasswordSuccess"),
                        content: (
                            <div>
                                <p>{t("userManagement.temporaryPassword")}</p>
                                <Text code copyable strong style={{fontSize: 16}}>
                                    {result.temporaryPassword}
                                </Text>
                            </div>
                        ),
                    });
                } catch (e: unknown) {
                    const err = e as {message?: string};
                    message.error(err?.message || t("userManagement.resetPasswordFailed"));
                }
            },
        });
    };

    return (
        <ResizableDrawer
            title={t("userManagement.editUser")}
            open={open}
            onClose={onClose}
            footer={
                <Space style={{display: "flex", justifyContent: "space-between"}}>
                    <Button danger onClick={handleResetPassword} disabled={loading}>
                        {t("userManagement.resetPassword")}
                    </Button>
                    <Space>
                        <Button onClick={onClose}>{t("common.cancel")}</Button>
                        <Button type="primary" onClick={handleSubmit} loading={loading}>
                            {t("common.save")}
                        </Button>
                    </Space>
                </Space>
            }
        >
            {user && (
                <div style={{marginBottom: 16}}>
                    <Text type="secondary">
                        {t("userManagement.username")}: {user.username}
                    </Text>
                    <br />
                    <Text type="secondary">
                        ID: {user.id}
                    </Text>
                </div>
            )}
            <Form
                form={form}
                layout="vertical"
                disabled={loading}
            >
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
                        options={teams.map((tm) => ({
                            value: tm.id,
                            label: tm.teamName,
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

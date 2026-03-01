import React, {useEffect, useMemo, useState} from "react";
import {App, Button, Divider, Drawer, Form, Input, Space, Tag, Typography} from "antd";
import {ApartmentOutlined, CalendarOutlined, MailOutlined, PhoneOutlined, TeamOutlined, UserOutlined} from "@ant-design/icons";
import dayjs from "@Webapp/config/dayjs";
import {useTranslation} from "react-i18next";
import {useAppDispatch, useAppSelector} from "@Webapp/store/hooks.ts";
import {selectCurrentUser, updateUser} from "@Webapp/store/slices/user-slice.ts";
import {userApi} from "@Webapp/api/modules/user/api.ts";
import type {UpdateProfileParams} from "@Webapp/api/modules/user/types.ts";
import "./profile-drawer.scss";

const {Text} = Typography;

interface ProfileDrawerProps {
    open: boolean;
    onClose: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({open, onClose}) => {
    const {t} = useTranslation();
    const [form] = Form.useForm();
    const dispatch = useAppDispatch();
    const currentUser = useAppSelector(selectCurrentUser);
    const {message} = App.useApp();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Calculate days since registration
    const membershipDays = useMemo(() => {
        if (!currentUser?.createDateTime) return 0;
        const registrationDate = dayjs(currentUser.createDateTime);
        const today = dayjs();
        return today.diff(registrationDate, "day");
    }, [currentUser?.createDateTime]);

    // Format registration date
    const formattedRegistrationDate = useMemo(() => {
        if (!currentUser?.createDateTime) return "-";
        return dayjs(currentUser.createDateTime).format(t("profile.dateFormat"));
    }, [currentUser?.createDateTime, t]);

    // Set form values when drawer opens or currentUser changes
    useEffect(() => {
        if (open && currentUser) {
            form.setFieldsValue({
                username: currentUser.username,
                fullName: currentUser.fullName || "",
                email: currentUser.email,
                phone: currentUser.phone || "",
            });
        }
    }, [open, currentUser, form]);

    const handleSubmit = async (values: UpdateProfileParams) => {
        if (!currentUser?.id) {
            message.error(t("profile.userInfoNotExist"));
            return;
        }

        setLoading(true);
        try {
            await userApi.updateProfile(values);

            // Update Redux store
            dispatch(updateUser({
                ...values,
                id: currentUser.id,
            }));

            message.success(t("profile.updateSuccess"));
            setIsEditing(false);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error
                ? error.message
                : t("profile.updateFailed");
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (currentUser) {
            form.setFieldsValue({
                username: currentUser.username,
                fullName: currentUser.fullName || "",
                email: currentUser.email,
                phone: currentUser.phone || "",
            });
        }
        setIsEditing(false);
    };

    return (
        <Drawer
            title={t("profile.title")}
            placement="right"
            size="large"
            onClose={onClose}
            open={open}
            forceRender
            footer={
                isEditing ? (
                    <div className="drawer-footer">
                        <Button onClick={handleCancel} style={{marginRight: 8}}>
                            {t("common.cancel")}
                        </Button>
                        <Button type="primary" onClick={() => form.submit()} loading={loading}>
                            {t("common.save")}
                        </Button>
                    </div>
                ) : (
                    <div className="drawer-footer">
                        <Button type="primary" onClick={() => setIsEditing(true)}>
                            {t("profile.editProfile")}
                        </Button>
                    </div>
                )
            }
        >
            <div className="profile-drawer-content">
                {/* Membership Info Section */}
                <div className="membership-section">
                    <Space size="small" style={{width: "100%", flexDirection: "column"}}>
                        <div className="info-item">
                            <Text type="secondary">
                                <CalendarOutlined /> {t("profile.registrationDate")}
                            </Text>
                            <Text strong>{formattedRegistrationDate}</Text>
                        </div>
                        <div className="membership-badge">
                            <Tag color="blue" style={{fontSize: "14px", padding: "4px 12px"}}>
                                {t("profile.membershipDays", {days: membershipDays})}
                            </Tag>
                        </div>
                    </Space>
                </div>

                <Divider />

                {/* User Info Form */}
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    disabled={!isEditing}
                >
                    <Form.Item
                        label={t("auth.username")}
                        name="username"
                        rules={[
                            {required: true, message: t("profile.usernameRequired")},
                            {min: 3, message: t("profile.usernameMinLength")},
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder={t("profile.usernamePlaceholder")}
                            disabled
                        />
                    </Form.Item>

                    <Form.Item
                        label={t("auth.fullName")}
                        name="fullName"
                        rules={[
                            {required: true, message: t("profile.fullNameRequired")},
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder={t("profile.fullNamePlaceholder")}
                        />
                    </Form.Item>

                    <Form.Item
                        label={t("auth.email")}
                        name="email"
                        rules={[
                            {required: true, message: t("profile.emailRequired")},
                            {type: "email", message: t("profile.emailInvalid")},
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder={t("profile.emailPlaceholder")}
                        />
                    </Form.Item>

                    <Form.Item
                        label={t("auth.phone")}
                        name="phone"
                    >
                        <Input
                            prefix={<PhoneOutlined />}
                            placeholder={t("profile.phonePlaceholder")}
                        />
                    </Form.Item>
                </Form>

                <Divider />

                {/* Organization Info (read-only) */}
                <div className="organization-section">
                    <Form layout="vertical">
                        <Form.Item label={t("profile.department")}>
                            <Input
                                prefix={<ApartmentOutlined />}
                                value={currentUser?.departmentName || t("profile.noDepartment")}
                                disabled
                                variant="filled"
                            />
                        </Form.Item>
                        <Form.Item label={t("profile.team")}>
                            <div>
                                {currentUser?.teamNames && currentUser.teamNames.length > 0 ? (
                                    <Space size={[4, 8]} wrap>
                                        {currentUser.teamNames.map((name, idx) => (
                                            <Tag key={idx} icon={<TeamOutlined />} color="blue">{name}</Tag>
                                        ))}
                                    </Space>
                                ) : (
                                    <Text type="secondary">{t("profile.noTeam")}</Text>
                                )}
                            </div>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </Drawer>
    );
};


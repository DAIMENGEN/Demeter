import React, {useState, useEffect, useMemo} from "react";
import {Drawer, Form, Input, Button, Divider, Typography, Space, Tag, App} from "antd";
import {UserOutlined, MailOutlined, PhoneOutlined, CalendarOutlined} from "@ant-design/icons";
import dayjs from "dayjs";
import {useAppDispatch, useAppSelector} from "@Webapp/store/hooks.ts";
import {selectCurrentUser, updateUser} from "@Webapp/store/slices/user-slice.ts";
import {userApi} from "@Webapp/api/modules/user/api.ts";
import type {UpdateUserParams} from "@Webapp/api/modules/user/types.ts";
import "./profile-drawer.scss";

const {Text} = Typography;

interface ProfileDrawerProps {
    open: boolean;
    onClose: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({open, onClose}) => {
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
        return dayjs(currentUser.createDateTime).format("YYYY年MM月DD日 HH:mm");
    }, [currentUser?.createDateTime]);

    useEffect(() => {
        if (currentUser) {
            form.setFieldsValue({
                username: currentUser.username,
                fullName: currentUser.fullName || "",
                email: currentUser.email,
                phone: currentUser.phone || "",
            });
        }
    }, [currentUser, form]);

    const handleSubmit = async (values: UpdateUserParams) => {
        if (!currentUser?.id) {
            message.error("用户信息不存在");
            return;
        }

        setLoading(true);
        try {
            await userApi.updateUser(currentUser.id, values);

            // Update Redux store
            dispatch(updateUser({
                ...values,
                id: currentUser.id,
            }));

            message.success("个人信息更新成功");
            setIsEditing(false);
        } catch (error: any) {
            message.error(error?.message || "更新失败，请重试");
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
            title="个人信息"
            placement="right"
            size="large"
            onClose={onClose}
            open={open}
            forceRender
            footer={
                isEditing ? (
                    <div className="drawer-footer">
                        <Button onClick={handleCancel} style={{marginRight: 8}}>
                            取消
                        </Button>
                        <Button type="primary" onClick={() => form.submit()} loading={loading}>
                            保存
                        </Button>
                    </div>
                ) : (
                    <div className="drawer-footer">
                        <Button type="primary" onClick={() => setIsEditing(true)}>
                            编辑资料
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
                                <CalendarOutlined /> 注册日期
                            </Text>
                            <Text strong>{formattedRegistrationDate}</Text>
                        </div>
                        <div className="membership-badge">
                            <Tag color="blue" style={{fontSize: "14px", padding: "4px 12px"}}>
                                已成为用户第 {membershipDays} 天 🎉
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
                        label="用户名"
                        name="username"
                        rules={[
                            {required: true, message: "请输入用户名"},
                            {min: 3, message: "用户名至少3个字符"},
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="请输入用户名"
                            disabled
                        />
                    </Form.Item>

                    <Form.Item
                        label="姓名"
                        name="fullName"
                        rules={[
                            {required: true, message: "请输入姓名"},
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="请输入姓名"
                        />
                    </Form.Item>

                    <Form.Item
                        label="邮箱"
                        name="email"
                        rules={[
                            {required: true, message: "请输入邮箱"},
                            {type: "email", message: "请输入有效的邮箱地址"},
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder="请输入邮箱"
                        />
                    </Form.Item>

                    <Form.Item
                        label="手机号"
                        name="phone"
                    >
                        <Input
                            prefix={<PhoneOutlined />}
                            placeholder="请输入手机号"
                        />
                    </Form.Item>
                </Form>
            </div>
        </Drawer>
    );
};


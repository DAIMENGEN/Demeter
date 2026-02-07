import "./register-page.scss";
import {useCallback} from "react";
import {Button, Form, Input, Layout, message} from "antd";
import {Link, useNavigate} from "react-router-dom";
import {type RegisterParams, useRegister} from "@Webapp/api";
import registerBgImage from "@Webapp/assets/backgrounds/auth-bg-image.jpeg";
import registerLogoImage from "@Webapp/assets/trademark/wine-red-logo.jpg";

const {Content} = Layout;

export const RegisterPage = () => {
    const navigate = useNavigate();
    const {register, loading} = useRegister();
    const [messageApi, contextHolder] = message.useMessage();

    const onFinish = useCallback(
        async (values: RegisterParams) => {
            try {
                await register(values);
                await messageApi.success("注册成功！即将跳转到登录页面...", 1);
                navigate("/login")
            } catch (error) {
                await messageApi.error(error instanceof Error ? error.message : "Register failed, please try again");
            }
        },
        [register, navigate, messageApi]
    );

    return (
        <Layout className="register-page">
            <Content className="register-content">
                {contextHolder}
                <div className="register-container">
                    <div
                        className="register-left"
                        style={{
                            backgroundImage: `url(${registerBgImage})`,
                        }}
                    >
                        <div className="overlay">
                            <div className="logo-container">
                                <img src={registerLogoImage} alt="Demeter"/>
                            </div>
                            <h1 className="welcome-title">Join Demeter</h1>
                            <p className="welcome-subtitle">
                                创建您的账户，开始您的旅程
                            </p>
                        </div>
                    </div>

                    <div className="register-right">
                        <div className="register-form">
                            <h2 className="form-title">创建新账户</h2>
                            <Form
                                name="registerForm"
                                onFinish={onFinish}
                                layout="vertical"
                                autoComplete="off"
                            >
                                <Form.Item
                                    label="用户名"
                                    name="username"
                                    rules={[
                                        {
                                            required: true,
                                            message: "请输入用户名！",
                                        },
                                        {
                                            min: 3,
                                            message: "用户名至少需要3个字符！",
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder="请输入用户名"
                                        autoComplete="username"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="全名"
                                    name="fullName"
                                    rules={[
                                        {
                                            required: true,
                                            message: "请输入您的全名！",
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder="请输入您的全名"
                                        autoComplete="name"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="邮箱"
                                    name="email"
                                    rules={[
                                        {
                                            required: true,
                                            message: "请输入邮箱！",
                                        },
                                        {
                                            type: "email",
                                            message: "请输入有效的邮箱地址！",
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder="请输入邮箱"
                                        autoComplete="email"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="手机号（可选）"
                                    name="phone"
                                    rules={[
                                        {
                                            pattern: /^1[3-9]\d{9}$/,
                                            message: "请输入有效的手机号码！",
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder="请输入手机号"
                                        autoComplete="tel"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="密码"
                                    name="password"
                                    rules={[
                                        {
                                            required: true,
                                            message: "请输入密码！",
                                        },
                                        {
                                            min: 6,
                                            message: "密码至少需要6个字符！",
                                        },
                                    ]}
                                >
                                    <Input.Password
                                        placeholder="请输入密码"
                                        autoComplete="new-password"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="确认密码"
                                    name="confirmPassword"
                                    dependencies={["password"]}
                                    rules={[
                                        {
                                            required: true,
                                            message: "请确认密码！",
                                        },
                                        ({getFieldValue}) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue("password") === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error("两次输入的密码不一致！"));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password
                                        placeholder="请再次输入密码"
                                        autoComplete="new-password"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        className="register-button"
                                        loading={loading}
                                        size="large"
                                        block
                                    >
                                        注册
                                    </Button>
                                </Form.Item>
                            </Form>

                            <div className="login-link">
                                <span>已有账号？</span>
                                <Link to="/login">立即登录</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </Content>
        </Layout>
    );
};

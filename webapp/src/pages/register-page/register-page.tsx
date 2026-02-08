import "./register-page.scss";
import {useCallback} from "react";
import {Button, Form, Input, Layout, message} from "antd";
import {Link, useNavigate} from "react-router-dom";
import {type RegisterParams, useRegister} from "@Webapp/api";
import registerBgImage from "@Webapp/assets/backgrounds/auth-bg-image.jpeg";
import registerLogoImage from "@Webapp/assets/trademark/wine-red-logo.jpg";
import {useTranslation} from "react-i18next";
import {LanguageSwitcher} from "@Webapp/components";

const {Content} = Layout;

export const RegisterPage = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {register, loading} = useRegister();
    const [messageApi, contextHolder] = message.useMessage();

    const onFinish = useCallback(
        async (values: RegisterParams) => {
            try {
                await register(values);
                await messageApi.success(t("auth.registerSuccess"), 1);
                navigate("/login")
            } catch (error) {
                await messageApi.error(error instanceof Error ? error.message : t("auth.registerFailed"));
            }
        },
        [register, navigate, messageApi, t]
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
                            <h1 className="welcome-title">{t("auth.joinTitle")}</h1>
                            <p className="welcome-subtitle">
                                {t("auth.createAccountSubtitle")}
                            </p>
                            <LanguageSwitcher style={{marginTop: "24px", color: "white"}} iconStyle={{color: "white"}}/>
                        </div>
                    </div>

                    <div className="register-right">
                        <div className="register-form">
                            <h2 className="form-title">{t("auth.createAccount")}</h2>
                            <Form
                                name="registerForm"
                                onFinish={onFinish}
                                layout="vertical"
                                autoComplete="off"
                            >
                                <Form.Item
                                    label={t("auth.username")}
                                    name="username"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("auth.usernameRequired"),
                                        },
                                        {
                                            min: 3,
                                            message: t("auth.usernameMinLength"),
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder={t("auth.usernamePlaceholder")}
                                        autoComplete="username"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label={t("auth.fullName")}
                                    name="fullName"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("auth.fullNameRequired"),
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder={t("auth.fullNamePlaceholder")}
                                        autoComplete="name"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label={t("auth.email")}
                                    name="email"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("auth.emailRequired"),
                                        },
                                        {
                                            type: "email",
                                            message: t("auth.emailInvalid"),
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder={t("auth.emailPlaceholder")}
                                        autoComplete="email"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label={t("auth.phoneOptional")}
                                    name="phone"
                                    rules={[
                                        {
                                            pattern: /^1[3-9]\d{9}$/,
                                            message: t("auth.phoneInvalid"),
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder={t("auth.phonePlaceholder")}
                                        autoComplete="tel"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label={t("auth.password")}
                                    name="password"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("auth.passwordRequired"),
                                        },
                                        {
                                            min: 6,
                                            message: t("auth.passwordMinLength"),
                                        },
                                    ]}
                                >
                                    <Input.Password
                                        placeholder={t("auth.passwordPlaceholder")}
                                        autoComplete="new-password"
                                        size="large"
                                    />
                                </Form.Item>

                                <Form.Item
                                    label={t("auth.confirmPassword")}
                                    name="confirmPassword"
                                    dependencies={["password"]}
                                    rules={[
                                        {
                                            required: true,
                                            message: t("auth.confirmPasswordRequired"),
                                        },
                                        ({getFieldValue}) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue("password") === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error(t("auth.passwordMismatch")));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password
                                        placeholder={t("auth.confirmPasswordPlaceholder")}
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
                                        {t("auth.register")}
                                    </Button>
                                </Form.Item>
                            </Form>

                            <div className="login-link">
                                <span>{t("auth.hasAccount")}</span>
                                <Link to="/login">{t("auth.loginNow")}</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </Content>
        </Layout>
    );
};

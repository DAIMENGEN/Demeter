import "./login-page.scss";
import {useCallback} from "react";
import {Button, Form, Input, Layout, message, Space} from "antd";
import {Link, useNavigate} from "react-router-dom";
import {type LoginParams, useLogin} from "@Webapp/api";
import {useAppDispatch} from "@Webapp/store/hooks";
import {loginFailure, loginSuccess} from "@Webapp/store/slices/user-slice";
import loginBgImage from "@Webapp/assets/backgrounds/auth-bg-image.jpeg";
import loginLogoImage from "@Webapp/assets/trademark/wine-red-logo.jpg";
import {useTranslation} from "react-i18next";
import {LanguageSwitcher} from "@Webapp/components";

const {Content} = Layout;

export const LoginPage = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const {login, loading} = useLogin();
    const [messageApi, contextHolder] = message.useMessage();

    const onFinish = useCallback(
        async (values: LoginParams) => {
            try {
                const response = await login(values);
                dispatch(loginSuccess(response.user));
                await messageApi.success(t("auth.loginSuccess"), 0.5);
                navigate("/home");
            } catch (error) {
                dispatch(loginFailure())
                await messageApi.error(error instanceof Error ? error.message : t("auth.loginFailed"));
            }
        },
        [login, dispatch, navigate, messageApi, t]
    );

    return (
        <Layout
            className="login-page"
            style={{
                backgroundImage: `url(${loginBgImage})`,
                backgroundSize: "cover",
                backgroundPosition: "44%",
                backgroundAttachment: "fixed",
            }}
        >
            <Content className="login-content">
                <div className="login-form">
                    {contextHolder}
                    <div className="language-switcher-container">
                        <LanguageSwitcher/>
                    </div>
                    <div className="logo-container">
                        <img src={loginLogoImage} alt="Demeter"/>
                    </div>
                    <h1 className="login-title">{t("auth.welcomeTitle")}</h1>
                    <Form
                        name="loginForm"
                        initialValues={{remember: true}}
                        onFinish={onFinish}
                        layout="vertical"
                    >
                        <Form.Item
                            name="username"
                            rules={[
                                {
                                    required: true,
                                    message: t("auth.usernameRequired"),
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
                            name="password"
                            rules={[
                                {
                                    required: true,
                                    message: t("auth.passwordRequired"),
                                },
                            ]}
                        >
                            <Input.Password
                                placeholder={t("auth.passwordPlaceholder")}
                                autoComplete="current-password"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                className="login-button"
                                loading={loading}
                                size="large"
                                block
                            >
                                {t("auth.login")}
                            </Button>
                        </Form.Item>
                    </Form>
                    <div className="register-link">
                        <Space>
                            <span className="register-link-text">{t("auth.noAccount")}</span>
                            <Link to="/register">
                                {t("auth.registerNow")}
                            </Link>
                        </Space>
                    </div>
                </div>
            </Content>
        </Layout>
    );
};

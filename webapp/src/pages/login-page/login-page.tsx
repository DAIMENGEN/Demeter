import "./login-page.scss";
import {useCallback} from "react";
import {Button, Form, Input, Layout, message, Space} from "antd";
import {useNavigate} from "react-router-dom";
import {type LoginParams, useLogin} from "@Webapp/api";
import {useAppDispatch} from "@Webapp/store/hooks";
import {loginFailure, loginSuccess} from "@Webapp/store/slices/user-slice";
import loginBgImage from "@Webapp/assets/backgrounds/auth-bg-image.jpeg";
import loginLogoImage from "@Webapp/assets/trademark/wine-red-logo.jpg";

const {Content} = Layout;

export const LoginPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const {login, loading} = useLogin();
    const [messageApi, contextHolder] = message.useMessage();

    const onFinish = useCallback(
        async (values: LoginParams) => {
            try {
                const response = await login(values);
                dispatch(loginSuccess(response.user));
                await messageApi.success("Login successful", 0.5);
                navigate("/home");
            } catch (error) {
                dispatch(loginFailure())
                await messageApi.error(error instanceof Error ? error.message : "Login failed, please try again");
            }
        },
        [login, dispatch, navigate, messageApi]
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
                    <div className="logo-container">
                        <img src={loginLogoImage} alt="Demeter"/>
                    </div>
                    <h1 className="login-title">Welcome to Demeter</h1>
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
                                    message: "请输入用户名！",
                                },
                            ]}
                        >
                            <Input
                                placeholder="用户名"
                                autoComplete="username"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[
                                {
                                    required: true,
                                    message: "请输入密码！",
                                },
                            ]}
                        >
                            <Input.Password
                                placeholder="密码"
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
                                登录
                            </Button>
                        </Form.Item>
                    </Form>
                    <div style={{textAlign: "center", width: "100%"}}>
                        <Space>
                            <span style={{color: "#a7a5a5"}}>还没有账号？</span>
                            <a href="#" onClick={() => navigate("/register")}>
                                立即注册
                            </a>
                        </Space>
                    </div>
                </div>
            </Content>
        </Layout>
    );
};

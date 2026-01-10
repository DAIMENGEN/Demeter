import "./login-page.scss";
import { useCallback } from "react";
import { Button, Form, Input, Layout, Space, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useLogin, type LoginParams } from "@Webapp/api";
import { useAppDispatch } from "@Webapp/store/hooks";
import { loginSuccess } from "@Webapp/store/slices/user-slice";
import loginBgImage from "@Webapp/assets/backgrounds/login-bg-image.jpeg";
import loginLogoImage from "@Webapp/assets/trademark/wine-red-logo.jpg";

const { Content } = Layout;

export const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { login, loading } = useLogin();
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = useCallback(
    async (values: LoginParams) => {
      try {
        const response = await login(values);

        // 保存 token 到 sessionStorage
        sessionStorage.setItem("token", response.data.token);
        sessionStorage.setItem("refreshToken", response.data.refreshToken);

        // 更新 Redux store
        dispatch(
          loginSuccess({
            id: response.data.userId,
            username: response.data.username,
            email: "", // 根据实际 API 返回调整
          })
        );

        await messageApi.success("登录成功");
        navigate("/home");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "登录失败，请重试";
        await messageApi.error(errorMessage);
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
            <img src={loginLogoImage} alt="Demeter" />
          </div>
          <h1 className="login-title">Welcome to Demeter</h1>
          <Form
            name="loginForm"
            initialValues={{ remember: true }}
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
          <div style={{ textAlign: "center", width: "100%" }}>
            <Space>
              <span style={{ color: "#a7a5a5" }}>还没有账号？</span>
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

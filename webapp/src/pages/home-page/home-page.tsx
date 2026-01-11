import "./home-page.scss";
import React, {useCallback} from "react";
import {Layout, Menu, Space, Avatar, Dropdown, Button, Typography, theme} from "antd";
import type {MenuProps} from "antd";
import {Outlet, useNavigate} from "react-router-dom";
import {HomeOutlined, LogoutOutlined, UserOutlined, SettingOutlined} from "@ant-design/icons";
import {useAppDispatch, useAppSelector} from "@Webapp/store/hooks";
import {logout as logoutAction, selectCurrentUser, selectIsAuthenticated} from "@Webapp/store/slices/user-slice";

const {Header, Content} = Layout;
const {Text} = Typography;

export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const currentUser = useAppSelector(selectCurrentUser);
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const {token} = theme.useToken(); // 获取主题 token

    const onClick: MenuProps["onClick"] = useCallback((e: {key: string}) => {
        const {key} = e;
        navigate(key);
    }, [navigate]);

    const handleLogout = useCallback(() => {
        // Clear tokens
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("refreshToken");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");

        // Clear Redux state
        dispatch(logoutAction());

        // Navigate to login
        navigate("/login");
    }, [navigate, dispatch]);

    const handleSignUp = useCallback(() => {
        navigate("/register");
    }, [navigate]);

    const handleProfile = useCallback(() => {
        navigate("/profile");
    }, [navigate]);

    // User dropdown menu items
    const userMenuItems: MenuProps["items"] = [
        {
            key: "user-info",
            label: (
                <div className="user-menu-header">
                    <Text strong>{currentUser?.fullName || currentUser?.username}</Text>
                    <Text type="secondary" style={{fontSize: '12px'}}>{currentUser?.email}</Text>
                </div>
            ),
            disabled: true,
        },
        {
            type: "divider",
        },
        {
            key: "profile",
            label: "个人设置",
            icon: <SettingOutlined />,
            onClick: handleProfile
        },
        {
            type: "divider",
        },
        {
            key: "logout",
            label: "退出登录",
            icon: <LogoutOutlined />,
            onClick: handleLogout,
            danger: true,
        }
    ];

    return (
        <Layout className="home-page">
            <Header className="header">
                <Space className="header-left">
                    <div className="logo">
                        <span>Demeter</span>
                    </div>
                    <Menu
                        className="header-left-menu"
                        onClick={onClick}
                        theme="dark"
                        mode="horizontal"
                        items={[{
                            key: "/home",
                            label: "Home",
                            icon: <HomeOutlined/>,
                        }]}
                    />
                </Space>
                <Space className="header-right" size="middle">
                    {isAuthenticated && currentUser ? (
                        <Dropdown
                            menu={{items: userMenuItems}}
                            placement="bottomRight"
                            trigger={['click']}
                        >
                            <div className="user-info-container">
                                <Avatar
                                    style={{cursor: "pointer", backgroundColor: token.colorPrimary}}
                                    icon={<UserOutlined />}
                                    size="default"
                                />
                                <span className="user-name">
                                    {currentUser.fullName || currentUser.username}
                                </span>
                            </div>
                        </Dropdown>
                    ) : (
                        <Button
                            type="primary"
                            onClick={handleSignUp}
                            size="middle"
                        >
                            Sign up
                        </Button>
                    )}
                </Space>
            </Header>
            <Content className="content">
                <Outlet/>
            </Content>
        </Layout>
    );
};


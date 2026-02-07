import "./home-page.scss";
import React, {useCallback, useMemo, useState} from "react";
import type {MenuProps} from "antd";
import {App, Avatar, Button, Dropdown, Layout, Menu, Space, theme, Typography} from "antd";
import {Outlet, useLocation, useNavigate} from "react-router-dom";
import {HomeOutlined, LogoutOutlined, SettingOutlined, UserOutlined} from "@ant-design/icons";
import {useAppDispatch, useAppSelector} from "@Webapp/store/hooks";
import {logout as logoutAction, selectCurrentUser, selectIsAuthenticated} from "@Webapp/store/slices/user-slice";
import {ProfileDrawer} from "@Webapp/pages/home-page/components/profile-drawer/profile-drawer";
import {authApi} from "@Webapp/api";
import {clearLoggingOut, markLoggingOut} from "@Webapp/http/client";
import {log} from "@Webapp/logging";

const {Header, Content} = Layout;
const {Text} = Typography;

export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const currentUser = useAppSelector(selectCurrentUser);
    const isAuthenticated = useAppSelector(selectIsAuthenticated);
    const {token} = theme.useToken(); // 获取主题 token
    const {message} = App.useApp();
    const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

    // Determine selected menu key based on current path
    const selectedKeys = useMemo(() => {
        const path = location.pathname;
        // Only highlight Home when on the home index page
        if (path === "/home" || path === "/home/") {
            return ["/home"];
        }
        // Don't highlight any menu item when on other pages (project-management, calendar, etc.)
        return [];
    }, [location.pathname]);

    const onClick: MenuProps["onClick"] = useCallback((e: { key: string }) => {
        const {key} = e;
        navigate(key);
    }, [navigate]);

    const handleLogout = useCallback(async () => {
        markLoggingOut();
        try {
            await authApi.logout();
        } catch (error) {
            // 即使 API 失败，也继续清理本地状态
            log.error('Logout API failed:', error);
            message.error('退出登录失败，但将清除本地状态');
        } finally {
            // Clear Redux state
            dispatch(logoutAction());

            // Navigate to login
            navigate("/login");
            clearLoggingOut();
        }
    }, [navigate, dispatch, message]);

    const handleSignUp = useCallback(() => {
        navigate("/register");
    }, [navigate]);

    const handleProfile = useCallback(() => {
        setProfileDrawerOpen(true);
    }, []);

    // User dropdown menu items
    const userMenuItems: MenuProps["items"] = useMemo(() => [
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
            icon: <SettingOutlined/>,
            onClick: handleProfile
        },
        {
            type: "divider",
        },
        {
            key: "logout",
            label: "退出登录",
            icon: <LogoutOutlined/>,
            onClick: handleLogout,
            danger: true,
        }
    ], [currentUser, handleProfile, handleLogout]);

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
                        selectedKeys={selectedKeys}
                        items={[
                            {
                                key: "/home",
                                label: "Home",
                                icon: <HomeOutlined/>,
                            }
                        ]}
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
                                    icon={<UserOutlined/>}
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

            <ProfileDrawer
                open={profileDrawerOpen}
                onClose={() => setProfileDrawerOpen(false)}
            />
        </Layout>
    );
};

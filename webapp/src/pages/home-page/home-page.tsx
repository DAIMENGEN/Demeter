import "./home-page.scss";
import React, {useCallback} from "react";
import {Layout, Menu, Space, Avatar, Dropdown} from "antd";
import type {MenuProps} from "antd";
import {Outlet, useNavigate} from "react-router-dom";
import {HomeOutlined, LogoutOutlined, UserOutlined} from "@ant-design/icons";

const {Header, Content} = Layout;

export const HomePage: React.FC = () => {
    const navigate = useNavigate();

    const onClick: MenuProps["onClick"] = useCallback((e: {key: string}) => {
        const {key} = e;
        switch (key) {
            case "/login":
                // Handle logout
                localStorage.removeItem("token");
                navigate(key);
                break;
            case "/home":
                navigate(key);
                break;
            default:
                break;
        }
    }, [navigate]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem("token");
        navigate("/login");
    }, [navigate]);

    const userMenuItems: MenuProps["items"] = [
        {
            key: "logout",
            label: "Logout",
            icon: <LogoutOutlined />,
            onClick: handleLogout
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
                <Space className="header-right">
                    <Dropdown menu={{items: userMenuItems}} placement="bottomRight">
                        <Avatar
                            style={{cursor: "pointer"}}
                            icon={<UserOutlined />}
                        />
                    </Dropdown>
                </Space>
            </Header>
            <Content className="content">
                <Outlet/>
            </Content>
        </Layout>
    );
};


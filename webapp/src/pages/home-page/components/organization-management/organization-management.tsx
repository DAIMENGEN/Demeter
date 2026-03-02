import React, {useCallback, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import type {MenuProps} from "antd";
import {Layout, Menu} from "antd";
import {ApartmentOutlined, TeamOutlined, UserOutlined} from "@ant-design/icons";
import {Outlet, useLocation, useNavigate} from "react-router-dom";
import "./organization-management.scss";

const {Sider, Content} = Layout;

export const OrganizationManagement: React.FC = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const selectedKeys = useMemo(() => {
        const path = location.pathname;
        if (path.includes("/organization-management/departments")) return ["departments"];
        if (path.includes("/organization-management/teams")) return ["teams"];
        if (path.includes("/organization-management/users")) return ["users"];
        return ["users"];
    }, [location.pathname]);

    const menuItems: MenuProps["items"] = useMemo(
        () => [
            {
                key: "users",
                icon: <UserOutlined />,
                label: t("organization.menuUsers"),
            },
            {
                key: "departments",
                icon: <ApartmentOutlined />,
                label: t("organization.menuDepartments"),
            },
            {
                key: "teams",
                icon: <TeamOutlined />,
                label: t("organization.menuTeams"),
            },
        ],
        [t]
    );

    const handleMenuClick: MenuProps["onClick"] = useCallback(
        (e: {key: string}) => {
            navigate(`/home/organization-management/${e.key}`);
        },
        [navigate]
    );

    return (
        <Layout className="organization-management">
            <Sider
                width={200}
                className="organization-management-sider"
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
            >
                <div className="organization-sidebar">
                    <Menu
                        mode="inline"
                        selectedKeys={selectedKeys}
                        items={menuItems}
                        onClick={handleMenuClick}
                        inlineCollapsed={collapsed}
                    />
                </div>
            </Sider>
            <Content className="organization-management-content">
                <Outlet />
            </Content>
        </Layout>
    );
};

import React, {useCallback, useEffect} from "react";
import {Tabs} from "antd";
import {TeamOutlined, ApartmentOutlined, UserOutlined} from "@ant-design/icons";
import {useTranslation} from "react-i18next";
import type {Project} from "@Webapp/api/modules/project";
import {ProjectPermission, useMyProjectPermissions} from "@Webapp/api/modules/project";
import {ResizableDrawer} from "@Webapp/components/resizable-drawer";
import {MemberTab} from "./components/member-tab";
import {TeamRoleTab} from "./components/team-role-tab";
import {DepartmentRoleTab} from "./components/department-role-tab";
import "./permission-drawer.scss";

interface PermissionDrawerProps {
    open: boolean;
    project: Project | null;
    onClose: () => void;
}

export const PermissionDrawer: React.FC<PermissionDrawerProps> = ({
    open,
    project,
    onClose,
}) => {
    const {t} = useTranslation();
    const {permissions, fetchPermissions, hasPermission} = useMyProjectPermissions();

    useEffect(() => {
        if (open && project) {
            fetchPermissions(project.id);
        }
    }, [open, project, fetchPermissions]);

    const canManageMembers = hasPermission(ProjectPermission.PROJECT_MANAGE_MEMBERS);

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    const tabItems = [
        {
            key: "members",
            label: (
                <span><UserOutlined /> {t("permission.members")}</span>
            ),
            children: project ? (
                <MemberTab
                    projectId={project.id}
                    open={open}
                    canManage={canManageMembers}
                    currentUserRole={permissions?.role}
                />
            ) : null,
        },
        {
            key: "teams",
            label: (
                <span><TeamOutlined /> {t("permission.teams")}</span>
            ),
            children: project ? (
                <TeamRoleTab
                    projectId={project.id}
                    open={open}
                    canManage={canManageMembers}
                    currentUserRole={permissions?.role}
                />
            ) : null,
        },
        {
            key: "departments",
            label: (
                <span><ApartmentOutlined /> {t("permission.departments")}</span>
            ),
            children: project ? (
                <DepartmentRoleTab
                    projectId={project.id}
                    open={open}
                    canManage={canManageMembers}
                    currentUserRole={permissions?.role}
                />
            ) : null,
        },
    ];

    return (
        <ResizableDrawer
            title={`${t("permission.title")} - ${project?.projectName ?? ""}`}
            open={open}
            onClose={handleClose}
            destroyOnHidden
            className="permission-drawer"
        >
            <Tabs items={tabItems} defaultActiveKey="members" />
        </ResizableDrawer>
    );
};

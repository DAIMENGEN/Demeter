import {createContext, useContext, useEffect, useMemo, type ReactNode} from "react";
import type {ProjectPermission, MyPermissionsResponse} from "@Webapp/api/modules/project/types";
import {useMyProjectPermissions} from "@Webapp/api/modules/project/hooks";

interface ProjectPermissionContextValue {
    /** 当前用户在此项目中的角色字符串（如 "owner"） */
    role?: string;
    /** 权限列表 */
    permissions: string[];
    /** 检查是否拥有指定权限 */
    hasPermission: (permission: ProjectPermission) => boolean;
    /** 完整的权限响应（含 roleSources） */
    raw?: MyPermissionsResponse;
    loading: boolean;
}

const ProjectPermissionContext = createContext<ProjectPermissionContextValue>({
    permissions: [],
    hasPermission: () => false,
    loading: false,
});

interface ProjectPermissionProviderProps {
    projectId: string;
    children: ReactNode;
}

/**
 * 为项目范围内的子组件提供权限上下文。
 * 挂载时自动获取当前用户在指定项目中的角色和权限列表。
 */
export const ProjectPermissionProvider = ({projectId, children}: ProjectPermissionProviderProps) => {
    const {permissions: raw, loading, fetchPermissions, hasPermission} = useMyProjectPermissions();

    useEffect(() => {
        fetchPermissions(projectId);
    }, [projectId, fetchPermissions]);

    const value = useMemo<ProjectPermissionContextValue>(() => ({
        role: raw?.role,
        permissions: raw?.permissions ?? [],
        hasPermission,
        raw: raw,
        loading,
    }), [raw, loading, hasPermission]);

    return (
        <ProjectPermissionContext.Provider value={value}>
            {children}
        </ProjectPermissionContext.Provider>
    );
};

/**
 * 在 ProjectPermissionProvider 子树中获取当前项目权限。
 */
export const useProjectPermission = () => useContext(ProjectPermissionContext);

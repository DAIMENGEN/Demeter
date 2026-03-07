import type {ReactNode} from "react";
import type {ProjectPermission} from "@Webapp/api/modules/project/types";
import {useProjectPermission} from "@Webapp/contexts/project-permission-context";

interface CanProps {
    /** 需要检查的权限 */
    permission: ProjectPermission;
    /** 有权限时渲染的内容 */
    children: ReactNode;
    /** 无权限时渲染的内容（默认不渲染） */
    fallback?: ReactNode;
}

/**
 * 声明式权限渲染组件。
 * 需在 <ProjectPermissionProvider> 子树中使用。
 *
 * @example
 * <Can permission={ProjectPermission.PROJECT_MANAGE_MEMBERS}>
 *     <Button>管理成员</Button>
 * </Can>
 */
export const Can = ({permission, children, fallback = null}: CanProps) => {
    const {hasPermission} = useProjectPermission();
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
};

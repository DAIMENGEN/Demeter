import type {ReactNode} from "react";
import {Navigate} from "react-router-dom";
import {useAppSelector} from "@Webapp/store/hooks";
import {selectIsAdmin} from "@Webapp/store/slices/user-slice";

interface AdminGuardProps {
    children: ReactNode;
}

/**
 * 管理员守卫：仅允许 super_admin / admin 角色访问子路由。
 * 非管理员直接重定向到 /home。
 */
export const AdminGuard = ({children}: AdminGuardProps) => {
    const isAdmin = useAppSelector(selectIsAdmin);

    if (!isAdmin) {
        return <Navigate to="/home" replace/>;
    }

    return <>{children}</>;
};

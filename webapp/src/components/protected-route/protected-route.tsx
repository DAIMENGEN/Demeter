import {Navigate} from "react-router-dom";
import {useAppSelector} from "@Webapp/store/hooks.ts";
import type {ReactNode} from "react";

interface ProtectedRouteProps {
    children: ReactNode;
}

/**
 * 路由保护组件
 * 用于保护需要登录才能访问的路由
 * 如果用户未登录，自动重定向到登录页面
 */
export const ProtectedRoute = ({children}: ProtectedRouteProps) => {
    const {isAuthenticated} = useAppSelector((state) => state.user);

    // 如果未认证，重定向到登录页
    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }

    // 已认证，渲染子组件
    return <>{children}</>;
};


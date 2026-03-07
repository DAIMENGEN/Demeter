import type {ReactNode} from "react";
import {useCallback, useEffect, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {App} from "antd";
import {useTranslation} from "react-i18next";
import {useSession} from "@Webapp/api";
import {authEvent} from "@Webapp/http";
import {useAppDispatch} from "@Webapp/store/hooks";
import {loginSuccess, logout as logoutAction} from "@Webapp/store/slices/user-slice";

interface AuthGuardProps {
    children: ReactNode;
}

/**
 * 会话守卫：仅包裹受保护路由，挂载时向后端验证 cookie 会话。
 * - 有效：回填 redux 用户信息
 * - 失效：清理 redux，跳转 /login
 *
 * 同时注册 authEvent 回调，当 token 刷新失败时收到通知并在 React 层进行路由跳转。
 */
export const AuthGuard = ({children}: AuthGuardProps) => {
    const {message} = App.useApp();
    const {t} = useTranslation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const {getSession} = useSession();

    const [checked, setChecked] = useState(false);
    const checkingRef = useRef(false);
    const notifiedRef = useRef(false);

    // 注册会话失效事件回调（token 刷新失败时触发）
    const handleSessionExpired = useCallback(() => {
        dispatch(logoutAction());
        navigate("/login", {replace: true});
    }, [dispatch, navigate]);

    useEffect(() => {
        authEvent.onSessionExpired(handleSessionExpired);
        return () => authEvent.onSessionExpired(null);
    }, [handleSessionExpired]);

    useEffect(() => {
        if (checkingRef.current) return;
        checkingRef.current = true;

        (async () => {
            try {
                const response = await getSession();
                dispatch(loginSuccess(response.user));
            } catch {
                if (!notifiedRef.current) {
                    notifiedRef.current = true;
                    message.info(t("auth.sessionExpired"), 2);
                }
                dispatch(logoutAction());
                navigate("/login", {replace: true});
            } finally {
                setChecked(true);
                checkingRef.current = false;
            }
        })();
    }, [dispatch, navigate, getSession, message, t]);

    if (!checked) return null;
    return <>{children}</>;
};

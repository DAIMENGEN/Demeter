import type {ReactNode} from "react";
import {useEffect, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {App} from "antd";
import {useSession} from "@Webapp/api";
import {useAppDispatch} from "@Webapp/store/hooks";
import {loginSuccess, logout as logoutAction} from "@Webapp/store/slices/user-slice";

interface AuthSessionGuardProps {
    children: ReactNode;
}

/**
 * 会话守卫：
 * - 在进入受保护路由区域（/home/**）时，向后端询问当前 cookie 会话是否有效
 * - 有效：回填 redux 用户信息
 * - 失效：清理 redux，跳转 /login
 */
export const AuthGuard = ({children}: AuthSessionGuardProps) => {
    const {message} = App.useApp();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const {getSession} = useSession();

    const [checked, setChecked] = useState(false);
    const checkingRef = useRef(false);
    const notifiedRef = useRef(false);

    useEffect(() => {
        const shouldCheck = location.pathname.startsWith("/home");
        if (!shouldCheck) {
            setChecked(true);
            return;
        }

        if (checkingRef.current) return;
        checkingRef.current = true;

        (async () => {
            try {
                const response = await getSession();
                dispatch(loginSuccess(response.user));
            } catch {
                if (!notifiedRef.current) {
                    notifiedRef.current = true;
                    message.info("登录状态已失效，请重新登录", 2);
                }
                dispatch(logoutAction());
                navigate("/login", {replace: true});
            } finally {
                setChecked(true);
                checkingRef.current = false;
            }
        })();
    }, [location.pathname, dispatch, navigate, getSession, message]);

    if (!checked) return null;
    return <>{children}</>;
};

/**
 * 认证模块 Hooks
 */

import {useCallback, useState} from "react";
import {authApi} from "./api";
import type {LoginParams, RegisterParams} from "./types";
import {assertApiOk} from "@Webapp/api/common/response";

/**
 * 登录 Hook
 */
export const useLogin = () => {
    const [loading, setLoading] = useState(false);

    const login = useCallback(async (params: LoginParams) => {
        setLoading(true);
        try {
            const response = await authApi.login(params);
            return assertApiOk(response);
        } finally {
            setLoading(false);
        }
    }, []);

    return {login, loading};
};

/**
 * 注册 Hook
 */
export const useRegister = () => {
    const [loading, setLoading] = useState(false);

    const register = useCallback(async (params: RegisterParams) => {
        setLoading(true);
        try {
            const response = await authApi.register(params);
            assertApiOk(response);
            return response
        } finally {
            setLoading(false);
        }
    }, []);

    return {register, loading};
};

/**
 * 会话 Hook
 *
 * 获取当前 cookie 会话对应的用户信息。
 */
export const useSession = () => {
    const [loading, setLoading] = useState(false);

    const getSession = useCallback(async () => {
        setLoading(true);
        try {
            const response = await authApi.getSession();
            assertApiOk(response);
            return response.data;
        } finally {
            setLoading(false);
        }
    }, []);

    return {getSession, loading};
};

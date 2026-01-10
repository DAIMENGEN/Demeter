/**
 * 认证模块 Hooks
 */

import {useCallback, useState} from "react";
import {authApi} from "./api";
import type {LoginParams, RegisterParams} from "./types";

/**
 * 登录 Hook
 */
export const useLogin = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const login = useCallback(async (params: LoginParams) => {
        setLoading(true);
        setError(null);
        try {
            return await authApi.login(params);
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Login failed");
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return {login, loading, error};
};

/**
 * 注册 Hook
 */
export const useRegister = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const register = useCallback(async (params: RegisterParams) => {
        setLoading(true);
        setError(null);
        try {
            return await authApi.register(params);
        } catch (err) {
            const error = err instanceof Error ? err : new Error("Registration failed");
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return {register, loading, error};
};


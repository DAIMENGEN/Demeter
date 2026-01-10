/**
 * 用户模块 Hooks
 */
import {useCallback, useState} from "react";
import {userApi} from "./api";
import type {User, UserQueryParams, CreateUserParams, UpdateUserParams} from "./types";
import {log} from "@Webapp/logging.ts";

/**
 * 用户列表 Hook
 */
export const useUserList = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
    });

    const fetchUsers = useCallback(async (params?: UserQueryParams) => {
        try {
            setLoading(true);
            setError(null);

            const response = await userApi.getUserList({
                page: pagination.page,
                pageSize: pagination.pageSize,
                ...params,
            });

            if (response.code === 200) {
                setUsers(response.data.list);
                setPagination((prev) => ({
                    ...prev,
                    total: response.data.total,
                    page: params?.page ?? prev.page,
                    pageSize: params?.pageSize ?? prev.pageSize,
                }));
            }
        } catch (err) {
            setError(err as Error);
            log.error("获取用户列表失败:", err);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.pageSize]);

    return {
        users,
        loading,
        error,
        pagination,
        fetchUsers,
        setPagination,
    };
};

/**
 * 用户详情 Hook
 */
export const useUserDetail = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchUser = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await userApi.getUserById(id);
            if (response.code === 200) {
                setUser(response.data);
            }
        } catch (err) {
            setError(err as Error);
            log.error("获取用户详情失败:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        user,
        loading,
        error,
        fetchUser,
    };
};

/**
 * 用户操作 Hook
 */
export const useUserActions = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const createUser = useCallback(async (data: CreateUserParams) => {
        try {
            setLoading(true);
            setError(null);

            const response = await userApi.createUser(data);

            if (response.code === 200) {
                return response.data;
            }
        } catch (err) {
            setError(err as Error);
            log.error("创建用户失败:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUser = useCallback(async (
        id: string,
        data: UpdateUserParams
    ) => {
        try {
            setLoading(true);
            setError(null);

            const response = await userApi.updateUser(id, data);

            if (response.code === 200) {
                return response.data;
            }
        } catch (err) {
            setError(err as Error);
            log.error("更新用户失败:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteUser = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);

            await userApi.deleteUser(id);
        } catch (err) {
            setError(err as Error);
            log.error("删除用户失败:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleUserStatus = useCallback(async (id: string, isActive: boolean) => {
        try {
            setLoading(true);
            setError(null);

            const response = await userApi.toggleUserStatus(id, isActive);

            if (response.code === 200) {
                return response.data;
            }
        } catch (err) {
            setError(err as Error);
            log.error("更新用户状态失败:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        createUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
    };
};







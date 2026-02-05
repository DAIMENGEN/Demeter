/**
 * 用户模块 Hooks
 */
import {useCallback, useState} from "react";
import {userApi} from "./api";
import type {CreateUserParams, UpdateUserParams, User, UserQueryParams} from "./types";
import {assertApiOk} from "@Webapp/api/common/response.ts";
import {DEFAULT_PAGINATION, type Pagination} from "@Webapp/api/common/pagination.ts";

/**
 * 用户列表 Hook
 */
export const useUserList = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);

    const fetchUsers = useCallback(async (params?: UserQueryParams) => {
        try {
            setLoading(true);
            const response = await userApi.getUserList({
                page: pagination.page,
                pageSize: pagination.pageSize,
                ...params,
            });

            const pageRes = assertApiOk(response);
            setUsers(pageRes.list);
            setPagination((prev) => ({
                ...prev,
                total: pageRes.total,
                page: params?.page ?? prev.page,
                pageSize: params?.pageSize ?? prev.pageSize,
            }));
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.pageSize]);

    return {
        users,
        loading,
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

    const fetchUser = useCallback(async (id: string) => {
        try {
            setLoading(true);
            const response = await userApi.getUserById(id);
            setUser(assertApiOk(response));
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        user,
        loading,
        fetchUser,
    };
};

/**
 * 用户操作 Hook
 */
export const useUserActions = () => {
    const [loading, setLoading] = useState(false);

    const createUser = useCallback(async (data: CreateUserParams) => {
        try {
            setLoading(true);
            const response = await userApi.createUser(data);
            return assertApiOk(response);
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
            const response = await userApi.updateUser(id, data);
            return assertApiOk(response);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteUser = useCallback(async (id: string) => {
        try {
            setLoading(true);
            const response = await userApi.deleteUser(id);
            assertApiOk(response);
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleUserStatus = useCallback(async (id: string, isActive: boolean) => {
        try {
            setLoading(true);
            const response = await userApi.toggleUserStatus(id, {isActive});
            return assertApiOk(response);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        createUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
    };
};

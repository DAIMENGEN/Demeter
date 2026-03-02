/**
 * 用户模块 Hooks
 */
import {useCallback, useRef, useState} from "react";
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

    const resetPassword = useCallback(async (id: string) => {
        try {
            setLoading(true);
            const response = await userApi.resetPassword(id);
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
        resetPassword,
    };
};

/**
 * 用户选择器 Hook（支持分页加载 + 搜索）
 *
 * 适用于需要在 Select 中选择用户的场景（例如自定义字段配置中的「人员」类型）。
 * 返回 `{ label, value }` 格式的选项列表，支持：
 * - 分页加载更多（loadMore）
 * - 关键词搜索（search）
 * - 手动注入选项（setOptions）
 * - 重置（reset）
 */
export interface UserSelectOption {
    label: string;
    value: string;
}

export const useUserSelectOptions = (params?: {
    pageSize?: number;
    activeOnly?: boolean;
}) => {
    const pageSize = params?.pageSize ?? 20;
    const activeOnly = params?.activeOnly ?? true;

    const [options, setOptions] = useState<UserSelectOption[]>([]);
    const [loading, setLoading] = useState(false);

    // 用 ref 追踪当前页码、是否还有更多、当前搜索关键词
    const pageRef = useRef(1);
    const hasMoreRef = useRef(true);
    const keywordRef = useRef("");

    const toOption = useCallback((user: User): UserSelectOption => ({
        value: user.id,
        label: `${user.fullName} (${user.username})`,
    }), []);

    /**
     * 搜索用户（重置分页，用新关键词重新拉取第一页）
     */
    const search = useCallback(async (keyword: string) => {
        const kw = (keyword ?? "").trim();
        keywordRef.current = kw;
        pageRef.current = 1;
        hasMoreRef.current = true;

        try {
            setLoading(true);
            const response = await userApi.getUserList({
                page: 1,
                pageSize,
                keyword: kw || undefined,
                isActive: activeOnly ? true : undefined,
            });
            const pageRes = assertApiOk(response);
            const mapped = pageRes.list.map(toOption);
            setOptions(mapped);
            hasMoreRef.current = pageRes.list.length >= pageSize;
        } finally {
            setLoading(false);
        }
    }, [pageSize, activeOnly, toOption]);

    /**
     * 加载更多（下一页追加）
     */
    const loadMore = useCallback(async () => {
        if (loading || !hasMoreRef.current) return;

        const nextPage = pageRef.current + 1;
        try {
            setLoading(true);
            const response = await userApi.getUserList({
                page: nextPage,
                pageSize,
                keyword: keywordRef.current || undefined,
                isActive: activeOnly ? true : undefined,
            });
            const pageRes = assertApiOk(response);
            const mapped = pageRes.list.map(toOption);
            pageRef.current = nextPage;
            hasMoreRef.current = pageRes.list.length >= pageSize;
            setOptions((prev) => {
                // 去重合并
                const map = new Map(prev.map((o) => [o.value, o]));
                for (const o of mapped) map.set(o.value, o);
                return Array.from(map.values());
            });
        } finally {
            setLoading(false);
        }
    }, [loading, pageSize, activeOnly, toOption]);

    /**
     * 重置为初始状态
     */
    const reset = useCallback(() => {
        setOptions([]);
        pageRef.current = 1;
        hasMoreRef.current = true;
        keywordRef.current = "";
    }, []);

    return {
        options,
        loading,
        search,
        loadMore,
        reset,
        setOptions,
    };
};

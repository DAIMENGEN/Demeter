/**
 * 用户模块 Hooks
 */
import {useCallback, useState} from "react";
import {userApi} from "./api";
import type {CreateUserParams, UpdateUserParams, User, UserOptionQueryParams, UserQueryParams} from "./types";
import type {UserSelectOption} from "./helpers";
import {toUserOptionSelectOption} from "./helpers";
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
            const response = await userApi.toggleUserStatus(id, isActive);
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

/**
 * 用户选项 Hook（分页 + 懒加载）
 * - 适合数据量很大时的 Select 远程搜索/无限滚动
 */
export const useUserSelectOptionsInfinite = (init?: { pageSize?: number; activeOnly?: boolean }) => {
    const pageSize = init?.pageSize ?? 20;
    const activeOnly = init?.activeOnly ?? true;
    const [options, setOptions] = useState<UserSelectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [total, setTotal] = useState<number>(0);

    const hasMore = options.length < total;

    const fetchPage = useCallback(async (nextPage: number, nextKeyword: string, reset: boolean) => {
        try {
            setLoading(true);
            const params: UserOptionQueryParams = {
                page: nextPage,
                pageSize,
                keyword: nextKeyword || undefined,
                isActive: activeOnly ? true : undefined,
            };

            const response = await userApi.getUserOptions(params);
            const pageRes = assertApiOk(response);

            const list = pageRes.list ?? [];
            setTotal(pageRes.total ?? 0);

            setOptions((prev) => {
                const incoming = list.map(toUserOptionSelectOption);
                if (reset) return incoming;

                // 去重合并
                const map = new Map(prev.map((x) => [x.value, x] as const));
                for (const opt of incoming) map.set(opt.value, opt);
                return Array.from(map.values());
            });

            setPage(nextPage);
        } finally {
            setLoading(false);
        }
    }, [activeOnly, pageSize]);

    const search = useCallback(async (kw?: string) => {
        const nextKeyword = (kw ?? "").trim();
        setKeyword(nextKeyword);
        await fetchPage(1, nextKeyword, true);
    }, [fetchPage]);

    const loadMore = useCallback(async () => {
        if (loading) return;
        if (!hasMore) return;
        await fetchPage(page + 1, keyword, false);
    }, [fetchPage, hasMore, keyword, loading, page]);

    const reset = useCallback(() => {
        setOptions([]);
        setKeyword("");
        setPage(1);
        setTotal(0);
    }, []);

    return {
        options,
        loading,
        keyword,
        page,
        pageSize,
        total,
        hasMore,
        search,
        loadMore,
        reset,
        setOptions,
    };
};

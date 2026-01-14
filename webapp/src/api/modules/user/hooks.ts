/**
 * 用户模块 Hooks
 */
import {useCallback, useState} from "react";
import {userApi} from "./api";
import type {User, UserQueryParams, CreateUserParams, UpdateUserParams} from "./types";
import {log} from "@Webapp/logging.ts";
import type { UserSelectOption } from "./helpers";
import { toUserOptionSelectOption } from "./helpers";
import type { UserOptionQueryParams } from "./types";

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

/**
 * 用户选项 Hook（分页 + 懒加载）
 * - 适合数据量很大时的 Select 远程搜索/无限滚动
 */
export const useUserSelectOptionsInfinite = (init?: { pageSize?: number; activeOnly?: boolean }) => {
    const pageSize = init?.pageSize ?? 20;
    const activeOnly = init?.activeOnly ?? true;

    const [options, setOptions] = useState<UserSelectOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const [keyword, setKeyword] = useState<string>("");
    const [page, setPage] = useState<number>(1);
    const [total, setTotal] = useState<number>(0);

    const hasMore = options.length < total;

    const fetchPage = useCallback(async (nextPage: number, nextKeyword: string, reset: boolean) => {
        try {
            setLoading(true);
            setError(null);

            const params: UserOptionQueryParams = {
                page: nextPage,
                pageSize,
                keyword: nextKeyword || undefined,
                isActive: activeOnly ? true : undefined,
            };

            const response = await userApi.getUserOptions(params);
            if (response.code === 200) {
                const list = response.data.list ?? [];
                setTotal(response.data.total ?? 0);

                setOptions((prev) => {
                    const incoming = list.map(toUserOptionSelectOption);
                    if (reset) return incoming;

                    // 去重合并
                    const map = new Map(prev.map((x) => [x.value, x] as const));
                    for (const opt of incoming) map.set(opt.value, opt);
                    return Array.from(map.values());
                });

                setPage(nextPage);
            }
        } catch (err) {
            setError(err as Error);
            log.error("获取用户选项（分页）失败:", err);
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
        setError(null);
    }, []);

    return {
        options,
        loading,
        error,
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

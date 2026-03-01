/**
 * 团队模块 Hooks
 */

import {useCallback, useState} from "react";
import {teamApi} from "./api";
import type {CreateTeamParams, Team, TeamQueryParams, UpdateTeamParams} from "./types";
import {assertApiOk} from "@Webapp/api/common/response";
import {DEFAULT_PAGINATION, type Pagination} from "@Webapp/api/common/pagination";

/**
 * 获取所有团队列表（Select 选项用）
 */
export const useAllTeams = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchTeams = useCallback(async () => {
        try {
            setLoading(true);
            const response = await teamApi.getAllTeams();
            setTeams(assertApiOk(response));
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        teams,
        loading,
        fetchTeams,
    };
};

/**
 * 团队列表 Hook（分页）
 */
export const useTeamList = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);

    const fetchTeams = useCallback(async (params?: TeamQueryParams) => {
        try {
            setLoading(true);
            const response = await teamApi.getTeamList({
                page: pagination.page,
                pageSize: pagination.pageSize,
                ...params,
            });
            const pageRes = assertApiOk(response);
            setTeams(pageRes.list);
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

    return {teams, loading, pagination, fetchTeams, setPagination};
};

/**
 * 团队操作 Hook
 */
export const useTeamActions = () => {
    const [loading, setLoading] = useState(false);

    const createTeam = useCallback(async (data: CreateTeamParams) => {
        try {
            setLoading(true);
            const response = await teamApi.createTeam(data);
            return assertApiOk(response);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateTeam = useCallback(async (id: string, data: UpdateTeamParams) => {
        try {
            setLoading(true);
            const response = await teamApi.updateTeam(id, data);
            return assertApiOk(response);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteTeam = useCallback(async (id: string) => {
        try {
            setLoading(true);
            const response = await teamApi.deleteTeam(id);
            assertApiOk(response);
        } finally {
            setLoading(false);
        }
    }, []);

    return {loading, createTeam, updateTeam, deleteTeam};
};

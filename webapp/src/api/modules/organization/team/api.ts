/**
 * 团队模块 API
 */

import type {PageResponse} from "@Webapp/http";
import {del, get, post, put} from "@Webapp/http";
import type {BatchDeleteTeamsParams, CreateTeamParams, Team, TeamQueryParams, UpdateTeamParams,} from "./types";

export const teamApi = {
    /** 获取团队列表（分页） */
    getTeamList: (params?: TeamQueryParams) => {
        return get<PageResponse<Team>>("/teams", params);
    },

    /** 获取所有团队列表（不分页） */
    getAllTeams: (params?: Omit<TeamQueryParams, "page" | "pageSize">) => {
        return get<Team[]>("/teams/all", params);
    },

    /** 根据 ID 获取团队详情 */
    getTeamById: (id: string) => {
        return get<Team>(`/teams/${id}`);
    },

    /** 创建团队 */
    createTeam: (data: CreateTeamParams) => {
        return post<Team>("/teams", data);
    },

    /** 更新团队 */
    updateTeam: (id: string, data: UpdateTeamParams) => {
        return put<Team>(`/teams/${id}`, data);
    },

    /** 删除团队 */
    deleteTeam: (id: string) => {
        return del<void>(`/teams/${id}`);
    },

    /** 批量删除团队 */
    batchDeleteTeams: (params: BatchDeleteTeamsParams) => {
        return post<void>("/teams/batch-delete", params);
    },
};

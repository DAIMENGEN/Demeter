/**
 * 团队模块 API
 */

import type {PaginatedResponse, ApiResponse} from "@Webapp/http";
import {del, get, post, put} from "@Webapp/http";
import type {BatchDeleteTeamsParams, CreateTeamParams, Team, TeamQueryParams, UpdateTeamParams,} from "./types";

export const teamApi = {
    /** 获取团队列表（分页） */
    getTeamList: (params?: TeamQueryParams) => {
        return get<PaginatedResponse<Team>>("/teams", params);
    },

    /** 获取所有团队列表（不分页） */
    getAllTeams: (params?: Omit<TeamQueryParams, "page" | "perPage">) => {
        return get<ApiResponse<Team[]>>("/teams/all", params);
    },

    /** 根据 ID 获取团队详情 */
    getTeamById: (id: string) => {
        return get<ApiResponse<Team>>(`/teams/${id}`);
    },

    /** 创建团队 */
    createTeam: (data: CreateTeamParams) => {
        return post<ApiResponse<Team>>("/teams", data);
    },

    /** 更新团队 */
    updateTeam: (id: string, data: UpdateTeamParams) => {
        return put<ApiResponse<Team>>(`/teams/${id}`, data);
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

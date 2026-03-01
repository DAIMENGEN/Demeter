/**
 * 团队模块类型定义
 */

export interface Team {
    id: string;
    teamName: string;
    description?: string;
    creatorId: string;
    updaterId?: string;
    createDateTime: string;
    updateDateTime?: string;
}

export interface CreateTeamParams {
    teamName: string;
    description?: string;
}

/**
 * 三态语义（与后端 Patch 语义对齐）：
 * - 字段未传（undefined / 不出现）：保持原值
 * - 字段传 null：清空（仅允许可空列）
 * - 字段传具体值：更新为该值
 */
export interface UpdateTeamParams {
    teamName?: string;
    /** 可空字段：传 null 可清空 */
    description?: string | null;
}

export interface TeamQueryParams {
    page?: number;
    pageSize?: number;
    teamName?: string;
}

export interface BatchDeleteTeamsParams {
    ids: string[];
}

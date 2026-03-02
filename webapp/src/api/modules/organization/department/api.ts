/**
 * 部门模块 API
 */

import type {PageResponse} from "@Webapp/http";
import {del, get, post, put} from "@Webapp/http";
import type {
    BatchDeleteDepartmentsParams,
    CreateDepartmentParams,
    Department,
    DepartmentQueryParams,
    UpdateDepartmentParams,
} from "./types";

export const departmentApi = {
    /** 获取部门列表（分页） */
    getDepartmentList: (params?: DepartmentQueryParams) => {
        return get<PageResponse<Department>>("/departments", params);
    },

    /** 获取所有部门列表（不分页） */
    getAllDepartments: (params?: Omit<DepartmentQueryParams, "page" | "pageSize">) => {
        return get<Department[]>("/departments/all", params);
    },

    /** 根据 ID 获取部门详情 */
    getDepartmentById: (id: string) => {
        return get<Department>(`/departments/${id}`);
    },

    /** 创建部门 */
    createDepartment: (data: CreateDepartmentParams) => {
        return post<Department>("/departments", data);
    },

    /** 更新部门 */
    updateDepartment: (id: string, data: UpdateDepartmentParams) => {
        return put<Department>(`/departments/${id}`, data);
    },

    /** 删除部门 */
    deleteDepartment: (id: string) => {
        return del<void>(`/departments/${id}`);
    },

    /** 批量删除部门 */
    batchDeleteDepartments: (params: BatchDeleteDepartmentsParams) => {
        return post<void>("/departments/batch-delete", params);
    },
};

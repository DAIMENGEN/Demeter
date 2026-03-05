/**
 * 部门模块 Hooks
 */

import {useCallback, useState} from "react";
import {departmentApi} from "./api";
import type {CreateDepartmentParams, Department, DepartmentQueryParams, UpdateDepartmentParams} from "./types";
import {unwrapData} from "@Webapp/api/common/response";
import {DEFAULT_PAGINATION, type Pagination} from "@Webapp/api/common/pagination";

/**
 * 获取所有部门列表（Select 选项用）
 */
export const useAllDepartments = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchDepartments = useCallback(async () => {
        try {
            setLoading(true);
            const response = await departmentApi.getAllDepartments();
            setDepartments(unwrapData(response));
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        departments,
        loading,
        fetchDepartments,
    };
};

/**
 * 部门列表 Hook（分页）
 */
export const useDepartmentList = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);

    const fetchDepartments = useCallback(async (params?: DepartmentQueryParams) => {
        try {
            setLoading(true);
            const response = await departmentApi.getDepartmentList({
                page: pagination.page,
                perPage: pagination.perPage,
                ...params,
            });
            setDepartments(response.data);
            setPagination((prev) => ({
                ...prev,
                total: response.meta.total,
                totalPages: response.meta.total_pages,
                page: params?.page ?? prev.page,
                perPage: params?.perPage ?? prev.perPage,
            }));
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.perPage]);

    return {departments, loading, pagination, fetchDepartments, setPagination};
};

/**
 * 部门操作 Hook
 */
export const useDepartmentActions = () => {
    const [loading, setLoading] = useState(false);

    const createDepartment = useCallback(async (data: CreateDepartmentParams) => {
        try {
            setLoading(true);
            const response = await departmentApi.createDepartment(data);
            return unwrapData(response);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateDepartment = useCallback(async (id: string, data: UpdateDepartmentParams) => {
        try {
            setLoading(true);
            const response = await departmentApi.updateDepartment(id, data);
            return unwrapData(response);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteDepartment = useCallback(async (id: string) => {
        try {
            setLoading(true);
            await departmentApi.deleteDepartment(id);
        } finally {
            setLoading(false);
        }
    }, []);

    return {loading, createDepartment, updateDepartment, deleteDepartment};
};

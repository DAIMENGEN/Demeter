/**
 * 假期模块 Hooks
 */

import { useCallback, useState } from "react";
import { holidayApi } from "./api";
import type {
  Holiday,
  HolidayQueryParams,
  CreateHolidayParams,
  UpdateHolidayParams,
  BatchDeleteHolidaysParams,
  BatchCreateHolidaysParams
} from "./types";
import { assertApiOk } from "@Webapp/api/common/response.ts";
import { DEFAULT_PAGINATION, type Pagination } from "@Webapp/api/common/pagination.ts";

/**
 * 假期列表 Hook
 */
export const useHolidayList = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);

  const fetchHolidays = useCallback(async (params?: HolidayQueryParams) => {
    try {
      setLoading(true);
      const response = await holidayApi.getHolidayList({
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...params
      });
      const pageRes = assertApiOk(response);
      setHolidays(pageRes.list);
      setPagination((prev) => ({
        ...prev,
        total: pageRes.total,
        page: params?.page ?? prev.page,
        pageSize: params?.pageSize ?? prev.pageSize
      }));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);

  return {
    holidays,
    loading,
    pagination,
    fetchHolidays,
    setPagination
  };
};

/**
 * 假期详情 Hook
 */
export const useHolidayDetail = () => {
  const [holiday, setHoliday] = useState<Holiday | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchHoliday = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await holidayApi.getHolidayById(id);
      setHoliday(assertApiOk(response));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    holiday,
    loading,
    fetchHoliday
  };
};

/**
 * 假期操作 Hook
 */
export const useHolidayActions = () => {
  const [loading, setLoading] = useState(false);

  const createHoliday = useCallback(async (data: CreateHolidayParams) => {
    try {
      setLoading(true);
      const response = await holidayApi.createHoliday(data);
      return assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateHoliday = useCallback(async (id: string, data: UpdateHolidayParams) => {
    try {
      setLoading(true);
      const response = await holidayApi.updateHoliday(id, data);
      return assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteHoliday = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await holidayApi.deleteHoliday(id);
      assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  const batchDeleteHolidays = useCallback(async (params: BatchDeleteHolidaysParams) => {
    try {
      setLoading(true);
      const response = await holidayApi.batchDeleteHolidays(params);
      assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  const batchCreateHolidays = useCallback(async (params: BatchCreateHolidaysParams) => {
    try {
      setLoading(true);
      const response = await holidayApi.batchCreateHolidays(params);
      return assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    batchDeleteHolidays,
    batchCreateHolidays
  };
};

/**
 * 获取所有假期（不分页） Hook
 */
export const useAllHolidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllHolidays = useCallback(async (params?: Omit<HolidayQueryParams, "page" | "pageSize">) => {
    try {
      setLoading(true);
      const response = await holidayApi.getAllHolidays(params);
      setHolidays(assertApiOk(response));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    holidays,
    loading,
    fetchAllHolidays
  };
};

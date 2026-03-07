/**
 * 假期模块 API
 */

import type {PaginatedResponse, ApiResponse} from "@Webapp/http";
import {del, get, post, put} from "@Webapp/http";
import type {
  BatchCreateHolidaysParams,
  BatchDeleteHolidaysParams,
  BatchUpdateHolidaysParams,
  CreateHolidayParams,
  Holiday,
  HolidayQueryParams,
  UpdateHolidayParams
} from "./types";

/**
 * 假期 API
 */
export const holidayApi = {
  /**
   * 获取假期列表（分页）
   */
  getHolidayList: (params?: HolidayQueryParams) => {
    return get<PaginatedResponse<Holiday>>("/holidays", params);
  },

  /**
   * 获取所有假期列表（不分页）
   */
  getAllHolidays: (params?: Omit<HolidayQueryParams, "page" | "perPage">) => {
    return get<ApiResponse<Holiday[]>>("/holidays/all", params);
  },

  /**
   * 根据 ID 获取假期详情
   */
  getHolidayById: (id: string) => {
    return get<ApiResponse<Holiday>>(`/holidays/${id}`);
  },

  /**
   * 创建假期
   */
  createHoliday: (data: CreateHolidayParams) => {
    return post<ApiResponse<Holiday>>("/holidays", data);
  },

  /**
   * 更新假期
   */
  updateHoliday: (id: string, data: UpdateHolidayParams) => {
    return put<ApiResponse<Holiday>>(`/holidays/${id}`, data);
  },

  /**
   * 删除假期
   */
  deleteHoliday: (id: string) => {
    return del<void>(`/holidays/${id}`);
  },

  /**
   * 批量删除假期
   */
  batchDeleteHolidays: (params: BatchDeleteHolidaysParams) => {
    return post<void>("/holidays/batch-delete", params);
  },

  /**
   * 批量创建假期
   */
  batchCreateHolidays: (params: BatchCreateHolidaysParams) => {
    return post<ApiResponse<Holiday[]>>("/holidays/batch-create", params);
  },

  /**
   * 批量更新假期
   */
  batchUpdateHolidays: (params: BatchUpdateHolidaysParams) => {
    return post<ApiResponse<Holiday[]>>("/holidays/batch-update", params);
  }
};


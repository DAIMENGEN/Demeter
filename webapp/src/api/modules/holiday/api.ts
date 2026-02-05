/**
 * 假期模块 API
 */

import { get, post, put, del } from "@Webapp/http";
import type { PageResponse } from "@Webapp/http";
import type {
  Holiday,
  CreateHolidayParams,
  UpdateHolidayParams,
  HolidayQueryParams,
  BatchDeleteHolidaysParams,
  BatchCreateHolidaysParams
} from "./types";

/**
 * 假期 API
 */
export const holidayApi = {
  /**
   * 获取假期列表（分页）
   */
  getHolidayList: (params?: HolidayQueryParams) => {
    return get<PageResponse<Holiday>>("/holidays", params);
  },

  /**
   * 获取所有假期列表（不分页）
   */
  getAllHolidays: (params?: Omit<HolidayQueryParams, "page" | "pageSize">) => {
    return get<Holiday[]>("/holidays/all", params);
  },

  /**
   * 根据 ID 获取假期详情
   */
  getHolidayById: (id: string) => {
    return get<Holiday>(`/holidays/${id}`);
  },

  /**
   * 创建假期
   */
  createHoliday: (data: CreateHolidayParams) => {
    return post<Holiday>("/holidays", data);
  },

  /**
   * 更新假期
   */
  updateHoliday: (id: string, data: UpdateHolidayParams) => {
    return put<Holiday>(`/holidays/${id}`, data);
  },

  /**
   * 删除假期
   */
  deleteHoliday: (id: string) => {
    return del<void>(`/holidays/${id}`);
  },

  /**
   * 批量删除假期
   * @returns 返回删除的数量
   */
  batchDeleteHolidays: (params: BatchDeleteHolidaysParams) => {
    return post<number>("/holidays/batch-delete", params);
  },

  /**
   * 批量创建假期
   */
  batchCreateHolidays: (params: BatchCreateHolidaysParams) => {
    return post<Holiday[]>("/holidays/batch-create", params);
  }
};


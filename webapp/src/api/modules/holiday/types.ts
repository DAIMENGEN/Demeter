/**
 * 假期模块类型定义
 */
/**
 * 假期数据类型
 */
export interface Holiday {
  id: string;
  holidayName: string;
  description?: string;
  holidayDate: string;
  holidayType: number;
  creatorId: string;
  updaterId?: string;
  createDateTime: string;
  updateDateTime?: string;
}
/**
 * 创建假期参数
 */
export interface CreateHolidayParams {
  holidayName: string;
  description?: string;
  holidayDate: string;
  holidayType: number;
}
/**
 * 更新假期参数
 *
 * 三态语义（与后端 Patch 语义对齐）：
 * - 字段未传（undefined / 不出现）：保持原值
 * - 字段传 null：清空（仅允许可空列）
 * - 字段传具体值：更新为该值
 */
export interface UpdateHolidayParams {
  holidayName?: string;
  /** 可空字段：传 null 可清空 */
  description?: string | null;
  holidayDate?: string;
  holidayType?: number;
}
/**
 * 假期查询参数
 */
export interface HolidayQueryParams {
  page?: number;
  pageSize?: number;
  holidayName?: string;
  holidayType?: number;
  startDate?: string;
  endDate?: string;
}
/**
 * 批量删除假期参数
 */
export interface BatchDeleteHolidaysParams {
  ids: string[];
}
/**
 * 批量创建假期参数
 */
export interface BatchCreateHolidaysParams {
  holidays: CreateHolidayParams[];
}

/**
 * 批量更新假期参数
 */
export interface BatchUpdateHolidaysParams {
  ids: string[];
  holidayName?: string;
  description?: string;
  holidayType?: number;
}

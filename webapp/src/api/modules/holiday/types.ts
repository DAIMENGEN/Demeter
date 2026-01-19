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
 */
export interface UpdateHolidayParams {
  holidayName?: string;
  description?: string;
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

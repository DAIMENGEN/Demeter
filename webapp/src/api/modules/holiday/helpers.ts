/**
 * 假期模块辅助函数
 */

import type {Holiday} from "./types";
import dayjs from "@Webapp/config/dayjs";

/**
 * 假期下拉选项类型
 */
export type HolidaySelectOption = {
  label: string;
  value: string;
};

/**
 * 将假期转换为 antd Select 可用的 option
 */
export const toHolidaySelectOption = (holiday: Holiday): HolidaySelectOption => ({
  value: holiday.id,
  label: `${holiday.holidayName} (${dayjs(holiday.holidayDate).format("YYYY-MM-DD")})`
});

/**
 * 格式化假期日期
 */
export const formatHolidayDate = (date: string, format = "YYYY-MM-DD"): string => {
  return dayjs(date).format(format);
};

/**
 * 判断假期是否已过期
 */
export const isHolidayExpired = (date: string): boolean => {
  return dayjs(date).isBefore(dayjs(), "day");
};

/**
 * 判断假期是否即将到来（未来N天内）
 */
export const isHolidayUpcoming = (date: string, days = 30): boolean => {
  const holidayDate = dayjs(date);
  const now = dayjs();
  return holidayDate.isAfter(now, "day") && holidayDate.diff(now, "day") <= days;
};


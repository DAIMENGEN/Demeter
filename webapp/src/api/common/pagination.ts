/**
 * 通用分页类型定义
 */

/**
 * 分页状态
 */
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * 默认分页状态
 */
export const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  pageSize: 10,
  total: 0
};

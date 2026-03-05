/**
 * 通用分页类型定义
 */

/**
 * 分页状态
 */
export interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/**
 * 默认分页状态
 */
export const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  perPage: 20,
  total: 0,
  totalPages: 0,
};

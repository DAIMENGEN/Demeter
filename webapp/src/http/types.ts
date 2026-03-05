/**
 * HTTP 请求相关的类型定义
 */

import type {AxiosRequestConfig} from "axios";

/**
 * 通用的 API 成功响应结构: { data: T }
 */
export interface ApiResponse<T = unknown> {
  data: T;
}

/**
 * 分页响应元信息
 */
export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * 分页响应链接
 */
export interface PaginationLinks {
  self: string;
  next?: string;
  prev?: string;
  first: string;
  last: string;
}

/**
 * 分页响应数据: { data: T[], meta: PaginationMeta, links: PaginationLinks }
 */
export interface PaginatedResponse<T = unknown> {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

/**
 * API 错误响应体
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: FieldError[];
  };
}

/**
 * 字段级验证错误
 */
export interface FieldError {
  field: string;
  message: string;
  code: string;
}

/**
 * 请求配置选项
 */
export interface RequestConfig extends AxiosRequestConfig {
  // 是否显示加载提示
  showLoading?: boolean;
  // 是否显示错误提示
  showError?: boolean;
  // 自定义错误处理
  customErrorHandler?: (error: unknown) => void;
}

/**
 * 分页请求参数
 */
export interface PageParams {
  page: number;
  perPage: number;
}

/**
 * HTTP 错误响应
 */
export interface HttpError {
  code: string;
  message: string;
  data?: unknown;
  status?: number;
}


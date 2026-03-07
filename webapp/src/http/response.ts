/**
 * HTTP 响应相关的类型定义和工具函数
 */

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
 * HTTP 错误响应
 */
export interface HttpError {
  code: string;
  message: string;
  data?: unknown;
  status?: number;
}

/**
 * API 业务错误，携带后端返回的错误码和附加数据
 */
export class ApiError extends Error {
  readonly code: string;
  readonly data: unknown;

  constructor(code: string, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.data = data;
  }
}

/**
 * 从 ApiResponse<T> 信封中提取 data 字段。
 * 如果传入的值不包含 data 字段，直接返回原值（兼容直接返回的简单值）。
 */
export const unwrapData = <T>(response: ApiResponse<T> | T): T => {
  if (response != null && typeof response === "object" && "data" in response) {
    return (response as ApiResponse<T>).data;
  }
  return response as T;
};

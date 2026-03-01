/**
 * HTTP 请求相关的类型定义
 */

import type {AxiosRequestConfig} from "axios";

/**
 * 通用的 API 响应结构
 */
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
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
  pageSize: number;
}

/**
 * 分页响应数据
 */
export interface PageResponse<T = unknown> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * HTTP 错误响应
 */
export interface HttpError {
  code: number;
  message: string;
  data?: unknown;
  status?: number;
}


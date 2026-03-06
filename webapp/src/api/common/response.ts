/**
 * API 响应解包工具
 *
 * 新的响应格式下：
 * - 成功响应直接返回 { data: T } 或 { data: T[], meta, links }
 * - 错误通过 HTTP 状态码 + { error: { code, message, details? } } 返回
 *
 */

import type {ApiResponse} from "@Webapp/http";

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

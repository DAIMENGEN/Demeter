/**
 * API 响应解包工具
 *
 * 将 API 响应解包为合法且类型安全的对象。可选地检查响应代码是否符合预期的成功代码。
 *
 * @template T - 响应数据的类型
 * @param {ApiResponse<T>} response - API 响应对象
 * @param {ApiOkCode} [okCode=200] - 可选的成功代码，默认为 200
 * @returns {T} - 解包后的响应数据
 * @throws {ApiError} - 如果响应代码不在成功代码范围内，则抛出业务错误
 */

import type {ApiResponse} from "@Webapp/http";

type ApiOkCode = number | readonly number[];

export class ApiError extends Error {
    readonly code: number;
    readonly data: unknown;

    constructor(code: number, message: string, data?: unknown) {
        super(message);
        this.name = "ApiError";
        this.code = code;
        this.data = data;
    }
}

const isOk = (code: number, okCode: ApiOkCode) => {
    return Array.isArray(okCode) ? okCode.includes(code) : code === okCode;
};

/**
 * 断言 API 响应成功，并返回 `data`
 *
 * @throws ApiError - 如果 `code` 不在 `okCode` 范围内
 */
export const assertApiOk = <T>(
    response: ApiResponse<T>,
    okCode: ApiOkCode = 200
): T => {
    if (!isOk(response.code, okCode)) {
        throw new ApiError(response.code, response.message, response.data);
    }
    return response.data;
};

/**
 * HTTP 请求方法封装
 */

import httpClient from "./client";
import {errorBus} from "./error-bus";
import type {HttpError} from "./response";
import type {AxiosRequestConfig, AxiosResponse} from "axios";

/** 判断是否为拦截器规范化后的 HttpError（排除原始 AxiosError） */
function isHttpError(e: unknown): e is HttpError {
    return (
        typeof e === "object" && e !== null &&
        "code" in e && "message" in e &&
        !("isAxiosError" in e)
    );
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
 * 通用请求方法
 */
async function request<T = unknown>(
    config: RequestConfig
): Promise<T> {
    try {
        const response: AxiosResponse<T> = await httpClient.request(config);

        // 204 No Content — return undefined
        if (
            response.status === 204
            || response.data == null
            || (typeof response.data === "string" && (response.data as string).length === 0)
        ) {
            return undefined as T;
        }

        return response.data;
    } catch (error) {
        if (config.customErrorHandler) {
            // 调用方自定义错误处理，不再全局弹窗
            config.customErrorHandler(error);
        } else if (isHttpError(error)) {
            // 无自定义处理时，通过全局事件总线展示错误提示
            errorBus.emit(error.message);
        }
        throw error;
    }
}

/**
 * GET 请求
 */
export async function get<T = unknown>(
    url: string,
    params?: unknown,
    config?: RequestConfig
): Promise<T> {
    return request<T>({
        ...config,
        method: "GET",
        url,
        params,
    });
}

/**
 * POST 请求
 */
export async function post<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
): Promise<T> {
    return request<T>({
        ...config,
        method: "POST",
        url,
        data,
    });
}

/**
 * PUT 请求
 */
export async function put<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
): Promise<T> {
    return request<T>({
        ...config,
        method: "PUT",
        url,
        data,
    });
}

/**
 * PATCH 请求
 */
export async function patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
): Promise<T> {
    return request<T>({
        ...config,
        method: "PATCH",
        url,
        data,
    });
}

/**
 * DELETE 请求
 */
export async function del<T = unknown>(
    url: string,
    params?: unknown,
    config?: RequestConfig
): Promise<T> {
    return request<T>({
        ...config,
        method: "DELETE",
        url,
        params,
    });
}

/**
 * 上传文件
 */
export async function upload<T = unknown>(
    url: string,
    file: File | Blob,
    config?: RequestConfig
): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);

    return request<T>({
        ...config,
        method: "POST",
        url,
        data: formData,
        headers: {
            "Content-Type": "multipart/form-data",
            ...config?.headers,
        },
    });
}

/**
 * 下载文件
 */
export async function download(
    url: string,
    params?: unknown,
    filename?: string,
    config?: RequestConfig
): Promise<void> {
    try {
        const response = await httpClient.request({
            ...config,
            method: "GET",
            url,
            params,
            responseType: "blob",
        });

        // 创建下载链接
        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;

        // 从响应头获取文件名或使用提供的文件名
        const contentDisposition = response.headers["content-disposition"];
        const filenameMatch = contentDisposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        link.download = filename || (filenameMatch ? filenameMatch[1] : "download");

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error("下载文件失败:", error);
        throw error;
    }
}

export default {
    get,
    post,
    put,
    patch,
    del,
    delete: del,
    upload,
    download,
    request,
};


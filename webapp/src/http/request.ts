/**
 * HTTP 请求方法封装
 */

import httpClient from "./client";
import type {ApiResponse, RequestConfig} from "./types";
import type {AxiosResponse} from "axios";

/**
 * 通用请求方法
 */
async function request<T = unknown>(
    config: RequestConfig
): Promise<ApiResponse<T>> {
    try {
        const response: AxiosResponse<ApiResponse<T>> = await httpClient.request(config);
        return response.data;
    } catch (error) {
        // 如果有自定义错误处理，则调用
        if (config.customErrorHandler) {
            config.customErrorHandler(error);
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
): Promise<ApiResponse<T>> {
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
): Promise<ApiResponse<T>> {
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
): Promise<ApiResponse<T>> {
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
): Promise<ApiResponse<T>> {
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
): Promise<ApiResponse<T>> {
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
): Promise<ApiResponse<T>> {
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


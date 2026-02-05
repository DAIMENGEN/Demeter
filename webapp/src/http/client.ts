/**
 * HTTP 客户端配置和实例
 */
import "@Webapp/logging";
import axios, { AxiosError } from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import type { ApiResponse, HttpError } from "./types";
import {log} from "@Webapp/logging.ts";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:9000/api";

/**
 * 创建 axios 实例
 */
const httpClient: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token 刷新状态管理
let isRefreshing = false;

type FailedQueueItem = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let failedRequestsQueue: FailedQueueItem[] = [];

function processQueue(error: unknown, token: string | null) {
  failedRequestsQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });
  failedRequestsQueue = [];
}

/**
 * 刷新 token
 */
const refreshToken = async (): Promise<string> => {
  // access_token/refresh_token 由 HttpOnly Cookie 承载，浏览器会在 withCredentials=true 时自动携带
  // 刷新成功后，后端会通过 Set-Cookie 更新 access_token
  await axios.post<ApiResponse<unknown>>(
    `${apiBaseUrl}/auth/refresh`,
    null,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  // 我们不再从响应体取 token，也不写入 storage；
  // 只返回占位值给队列继续重试（实际鉴权由 cookie 完成）
  return "cookie";
};

// 显式登出状态（避免登出过程中 401 触发刷新/重试）
let isLoggingOut = false;

export function markLoggingOut() {
  isLoggingOut = true;
  // 登出视为终止当前会话：清空等待队列，避免悬挂
  processQueue(new Error("Logging out"), null);
}

export function clearLoggingOut() {
  isLoggingOut = false;
}

/**
 * 请求拦截器
 */
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // access_token 由 HttpOnly Cookie 承载，无需在前端手动设置 Authorization
    return config;
  },
  (error: AxiosError) => {
    log.error("Request error:", error);
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 */
httpClient.interceptors.response.use(
  (response) => {
    // 直接返回响应数据
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    // 登出过程中：不做刷新、不做重试，直接拒绝（避免二次跳转/提示）
    if (isLoggingOut) {
      return Promise.reject(error);
    }

    // 处理 401 错误，进行 token 刷新
    if (error.response?.status === 401 && originalRequest) {
      // 如果当前正在登出，则不刷新
      if (isLoggingOut) {
        return Promise.reject(error);
      }

      // 避免同一个请求无限重试（例如 refreshToken 已失效时）
      if (originalRequest._retry) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      // 如果正在刷新 token，将请求加入队列
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            resolve: () => {
              // access_token 由 cookie 承载，不需要更新 Authorization
              resolve(httpClient(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        // 刷新 token（cookie 鉴权模式下不需要使用返回值）
        await refreshToken();

        // 更新原始请求的 token
        if (originalRequest.headers) {
          delete (originalRequest.headers as Record<string, unknown>).Authorization;
        }

        // 处理队列中的请求
        processQueue(null, "cookie");

        // 重试原始请求
        return httpClient(originalRequest);
      } catch (refreshError) {
        // 刷新失败：统一 reject 队列中的请求，避免 Promise 悬挂
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 处理其他错误
    const httpError: HttpError = {
      code: 0,
      message: "Unknown error",
    };

    if (error.response) {
      // 服务器返回了错误响应
      const { status, data } = error.response;
      httpError.status = status;
      httpError.code = data?.code || status;
      httpError.message = data?.message || "Server error";
      httpError.data = data?.data;

      // 根据状态码处理不同的错误
      switch (status) {
        case 403:
          httpError.message = "You do not have permission to access this resource";
          break;
        case 404:
          httpError.message = "The requested resource does not exist";
          break;
        case 500:
          httpError.message = "Internal server error";
          break;
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      httpError.message = "Network error, please check your connection";
    } else {
      // 请求配置出错
      httpError.message = error.message || "Request configuration error";
    }

    log.error("Response error:", httpError);
    return Promise.reject(httpError);
  }
);

export default httpClient;


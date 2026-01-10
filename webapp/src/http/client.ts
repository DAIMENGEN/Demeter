/**
 * HTTP 客户端配置和实例
 */
import "@Webapp/logging";
import axios, { AxiosError } from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import type { ApiResponse, HttpError } from "./types";
import {log} from "@Webapp/logging.ts";

/**
 * 创建 axios 实例
 */
const httpClient: AxiosInstance = axios.create({
  baseURL: "http://127.0.0.1:9000/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token 刷新状态管理
let isRefreshing = false;
let failedRequestsQueue: Array<(token: string) => void> = [];

/**
 * 刷新 token
 */
const refreshToken = async (): Promise<string> => {
  const refreshToken = sessionStorage.getItem("refreshToken");
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await axios.post<ApiResponse<{ token: string; refreshToken: string }>>(
      "http://127.0.0.1:9090/api/auth/refresh",
      { refreshToken },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const { token, refreshToken: newRefreshToken } = response.data.data;
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("refreshToken", newRefreshToken);

    return token;
  } catch (error) {
    // 刷新失败，清除 token 并跳转到登录页
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refreshToken");
    window.location.href = "/login";
    throw error;
  }
};

/**
 * 请求拦截器
 */
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 sessionStorage 或其他地方获取 token
    const token = sessionStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 可以在这里添加其他通用的请求头
    return config;
  },
  (error: AxiosError) => {
    log.error("请求错误:", error);
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
    const originalRequest = error.config;

    // 处理 401 错误，进行 token 刷新
    if (error.response?.status === 401 && originalRequest) {
      // 如果正在刷新 token，将请求加入队列
      if (isRefreshing) {
        return new Promise((resolve) => {
          failedRequestsQueue.push((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(httpClient(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        // 刷新 token
        const newToken = await refreshToken();

        // 更新原始请求的 token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        // 处理队列中的请求
        failedRequestsQueue.forEach((callback) => callback(newToken));
        failedRequestsQueue = [];

        // 重试原始请求
        return httpClient(originalRequest);
      } catch (refreshError) {
        // 刷新失败，清空队列
        failedRequestsQueue = [];
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 处理其他错误
    const httpError: HttpError = {
      code: 0,
      message: "未知错误",
    };

    if (error.response) {
      // 服务器返回了错误响应
      const { status, data } = error.response;
      httpError.status = status;
      httpError.code = data?.code || status;
      httpError.message = data?.message || "服务器错误";
      httpError.data = data?.data;

      // 根据状态码处理不同的错误
      switch (status) {
        case 403:
          httpError.message = "没有权限访问该资源";
          break;
        case 404:
          httpError.message = "请求的资源不存在";
          break;
        case 500:
          httpError.message = "服务器内部错误";
          break;
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      httpError.message = "网络错误，请检查网络连接";
    } else {
      // 请求配置出错
      httpError.message = error.message || "请求配置错误";
    }

    console.error("响应错误:", httpError);
    return Promise.reject(httpError);
  }
);

export default httpClient;


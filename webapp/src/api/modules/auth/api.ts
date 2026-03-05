/**
 * 认证模块 API
 */

import type {ApiResponse} from "@Webapp/http";
import {get, post} from "@Webapp/http";
import type {AuthResponse, LoginParams, RegisterParams} from "./types";

/**
 * 认证 API
 */
export const authApi = {
  /**
   * 用户登录
   */
  login: (data: LoginParams) => {
    return post<ApiResponse<AuthResponse>>("/auth/login", data);
  },

  /**
   * 用户注册
   */
  register: (data: RegisterParams) => {
    return post<ApiResponse<AuthResponse>>("/auth/register", data);
  },

  /**
   * 用户登出
   */
  logout: () => {
    return post<void>("/auth/logout");
  },

  /**
   * 刷新 Token
   */
  refreshToken: () => {
    return post<ApiResponse<AuthResponse>>("/auth/refresh");
  },

  /**
   * 获取当前会话用户信息（需要已登录 cookie）
   */
  getSession: () => {
    return get<ApiResponse<AuthResponse>>("/auth/session");
  },
};

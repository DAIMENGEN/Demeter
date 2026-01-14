/**
 * 认证模块 API
 */

import { post } from "@Webapp/http";
import type { LoginParams, LoginResponse, RegisterParams } from "./types";

/**
 * 认证 API
 */
export const authApi = {
  /**
   * 用户登录
   */
  login: (data: LoginParams) => {
    return post<LoginResponse>("/auth/login", data);
  },

  /**
   * 用户注册
   */
  register: (data: RegisterParams) => {
    return post<LoginResponse>("/auth/register", data);
  },

  /**
   * 用户登出
   */
  logout: () => {
    // refresh_token 由 HttpOnly Cookie 承载，不需要传参
    return post<void>("/auth/logout");
  },

  /**
   * 刷新 Token
   */
  refreshToken: () => {
    return post<void>("/auth/refresh");
  },
};

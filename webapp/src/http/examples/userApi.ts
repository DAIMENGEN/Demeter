/**
 * 用户相关 API 示例
 *
 * 这个文件展示了如何使用 http 模块来定义具体的 API 接口
 */

import { get, post, put, del } from "..";
import type { PageParams, PageResponse } from "..";

/**
 * 用户数据类型
 */
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

/**
 * 用户登录参数
 */
export interface LoginParams {
  username: string;
  password: string;
}

/**
 * 用户登录响应
 */
export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * 用户 API
 */
export const userApi = {
  /**
   * 用户登录
   */
  login: (params: LoginParams) => {
    return post<LoginResponse>("/auth/login", params);
  },

  /**
   * 获取当前用户信息
   */
  getCurrentUser: () => {
    return get<User>("/users/me");
  },

  /**
   * 获取用户列表（分页）
   */
  getUserList: (params: PageParams) => {
    return get<PageResponse<User>>("/users", params);
  },

  /**
   * 获取用户详情
   */
  getUserById: (id: string) => {
    return get<User>(`/users/${id}`);
  },

  /**
   * 创建用户
   */
  createUser: (data: Omit<User, "id" | "createdAt">) => {
    return post<User>("/users", data);
  },

  /**
   * 更新用户
   */
  updateUser: (id: string, data: Partial<User>) => {
    return put<User>(`/users/${id}`, data);
  },

  /**
   * 删除用户
   */
  deleteUser: (id: string) => {
    return del<void>(`/users/${id}`);
  },
};


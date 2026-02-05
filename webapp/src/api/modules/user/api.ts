/**
 * 用户模块 API
 */

import { get, post, put, del } from "@Webapp/http";
import type { PageResponse } from "@Webapp/http";
import type {
  User,
  CreateUserParams,
  UpdateUserParams,
  UserQueryParams,
  UserOptionQueryParams,
  UserOption
} from "./types";

/**
 * 用户 API
 */
export const userApi = {
  /**
   * 获取用户列表（分页）
   */
  getUserList: (params?: UserQueryParams) => {
    return get<PageResponse<User>>("/users", params);
  },

  /**
   * 获取所有用户列表（不分页）
   */
  getAllUsers: (params?: Omit<UserQueryParams, "page" | "pageSize">) => {
    return get<User[]>("/users/all", params);
  },

  /**
   * 根据 ID 获取用户详情
   */
  getUserById: (id: string) => {
    return get<User>(`/users/${id}`);
  },

  /**
   * 根据用户名查询用户
   */
  getUserByUsername: (username: string) => {
    return get<User>(`/users/username/${username}`);
  },

  /**
   * 创建用户
   */
  createUser: (data: CreateUserParams) => {
    return post<User>("/users", data);
  },

  /**
   * 更新用户
   */
  updateUser: (id: string, data: UpdateUserParams) => {
    return put<User>(`/users/${id}`, data);
  },

  /**
   * 删除用户
   */
  deleteUser: (id: string) => {
    return del<void>(`/users/${id}`);
  },

  /**
   * 批量删除用户
   */
  batchDeleteUsers: (ids: string[]) => {
    return post<void>("/users/batch-delete", { ids });
  },

  /**
   * 激活/停用用户
   */
  toggleUserStatus: (id: string, isActive: boolean) => {
    return put<User>(`/users/${id}/status`, { isActive });
  },

  /**
   * 获取用户下拉选项（分页，轻量字段）
   */
  getUserOptions: (params?: UserOptionQueryParams) => {
    return get<PageResponse<UserOption>>("/users/options", params);
  },
};

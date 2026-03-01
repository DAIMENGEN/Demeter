/**
 * 用户模块 API
 */

import type {PageResponse} from "@Webapp/http";
import {del, get, post, put} from "@Webapp/http";
import type {
  BatchDeleteUsersParams,
  CreateUserParams,
  ResetPasswordResponse,
  ToggleUserStatusParams,
  UpdateProfileParams,
  UpdateUserParams,
  User,
  UserQueryParams
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
  batchDeleteUsers: (params: BatchDeleteUsersParams) => {
    return post<void>("/users/batch-delete", params);
  },

  /**
   * 激活/停用用户
   */
  toggleUserStatus: (id: string, params: ToggleUserStatusParams) => {
    return put<User>(`/users/${id}/status`, params);
  },

  /**
   * 重置用户密码（管理员）
   */
  resetPassword: (id: string) => {
    return post<ResetPasswordResponse>(`/users/${id}/reset-password`);
  },

  /**
   * 修改当前用户个人资料
   */
  updateProfile: (data: UpdateProfileParams) => {
    return put<User>("/users/me", data);
  },
};

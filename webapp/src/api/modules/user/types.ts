/**
 * 用户模块类型定义
 */
/**
 * 用户数据类型
 */
export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  creatorId: string;
  updaterId?: string;
  createDateTime: string;
  updateDateTime?: string;
}
/**
 * 创建用户参数
 */
export interface CreateUserParams {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone?: string;
  isActive?: boolean;
}
/**
 * 更新用户参数
 */
export interface UpdateUserParams {
  username?: string;
  password?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}
/**
 * 用户查询参数
 */
export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  username?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

/**
 * 用户选项数据类型 (用于下拉选择)
 */
export interface UserOption {
  id: string;
  username: string;
  fullName: string;
  isActive: boolean;
}

/**
 * 用户选项查询参数 (用于下拉选择)
 */
export interface UserOptionQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  isActive?: boolean;
}

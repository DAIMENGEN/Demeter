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
  /** 模糊搜索关键词，同时匹配 username 和 fullName（OR 逻辑） */
  keyword?: string;
  username?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

/**
 * 批量删除用户参数
 */
export interface BatchDeleteUsersParams {
  ids: string[];
}

/**
 * 切换用户状态参数
 */
export interface ToggleUserStatusParams {
  isActive: boolean;
}


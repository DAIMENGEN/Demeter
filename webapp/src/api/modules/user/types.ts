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
  departmentId?: string;
  /** 部门名称（后端 JOIN 返回） */
  departmentName?: string;
  teamIds: string[];
  /** 团队名称列表（后端 JOIN 返回，与 teamIds 一一对应） */
  teamNames: string[];
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
  departmentId?: string;
  teamIds?: string[];
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
  departmentId?: string | null;
  teamIds?: string[];
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
  departmentId?: string;
  teamId?: string;
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

/**
 * 重置密码响应
 */
export interface ResetPasswordResponse {
  temporaryPassword: string;
}

/**
 * 用户自行修改个人资料参数（仅 fullName / email / phone）
 */
export interface UpdateProfileParams {
  fullName?: string;
  email?: string;
  phone?: string;
}


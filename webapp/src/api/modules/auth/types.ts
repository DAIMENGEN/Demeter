/**
 * 认证模块类型定义
 */

import type {User} from "@Webapp/api/modules/user/types";

/**
 * 登录请求参数
 */
export interface LoginParams {
    username: string;
    password: string;
}

/**
 * 认证响应数据（登录、注册、刷新token、获取会话）
 * 返回完整的 User（含部门 / 团队等组织关系）
 */
export interface AuthResponse {
    user: User;
}

/**
 * 注册请求参数
 */
export interface RegisterParams {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone?: string;
}

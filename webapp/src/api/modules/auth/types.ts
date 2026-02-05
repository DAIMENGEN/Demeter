/**
 * 认证模块类型定义
 */

/**
 * 登录请求参数
 */
export interface LoginParams {
    username: string;
    password: string;
}

/**
 * 登录响应数据
 */
export interface LoginResponse {
    user: {
        id: string;
        username: string;
        fullName: string;
        email: string;
        phone?: string;
        isActive: boolean;
        createDateTime?: string;
    };
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

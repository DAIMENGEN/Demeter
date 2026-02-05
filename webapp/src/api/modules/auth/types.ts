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
 * 认证响应数据（登录、注册、刷新token、获取会话）
 */
export interface AuthResponse {
    user: {
        id: string;  // 后端 Id 类型序列化为 string（避免 JS 数字精度问题）
        username: string;
        fullName: string;
        email: string;
        phone?: string;
        isActive: boolean;
        createDateTime: string;
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

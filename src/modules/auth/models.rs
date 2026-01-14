use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// 注册请求参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
    pub full_name: String,
    pub email: String,
    pub phone: Option<String>,
}

/// 登录请求参数
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

/// 认证响应
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthResponse {
    pub user: UserInfo,
}

/// 用户信息
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UserInfo {
    pub id: i64,
    pub username: String,
    pub full_name: String,
    pub email: String,
    pub phone: Option<String>,
    pub is_active: bool,
}

/// 刷新令牌数据库模型
#[derive(Debug, FromRow)]
pub struct RefreshToken {
    pub id: i64,
    pub user_id: i64,
    pub token: String,
    pub expires_at: chrono::NaiveDateTime,
    pub created_at: chrono::NaiveDateTime,
}

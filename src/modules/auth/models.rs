use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::common::id::Id;
use crate::modules::user::models::User;

/// 仅供 auth 模块内部使用的轻量用户结构（只查 users 表，不 JOIN 组织关系）。
///
/// 替代原来借用的 `user::models::User`，使 auth 模块脱离对 user 模块类型的依赖。
/// 用于密码校验、注册 INSERT 之后的 RETURNING、核实 active 状态等内部场景。
#[derive(Debug, Clone, FromRow)]
pub struct AuthUser {
    pub id: Id,
    pub username: String,
    pub password: Option<String>,
    pub full_name: String,
    pub email: String,
    pub phone: Option<String>,
    pub is_active: bool,
    pub creator_id: Id,
    pub updater_id: Option<Id>,
    pub create_date_time: chrono::NaiveDateTime,
    pub update_date_time: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
    pub full_name: String,
    pub email: String,
    pub phone: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

/// 登录/注册/刷新/会话等接口统一返回的响应体。
///
/// 使用 `user::models::User` 作为用户信息，包含完整的部门/团队等组织关系。
/// `User` 上的 `password` 字段已标记 `#[serde(skip_serializing)]`，不会泄漏。
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthResponse {
    pub user: User,
}

#[derive(Debug, FromRow)]
pub struct RefreshToken {
    pub id: i64,
    pub user_id: i64,
    pub token: String,
    pub expires_at: chrono::NaiveDateTime,
    pub created_at: chrono::NaiveDateTime,
}

use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// 用户数据模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: String,
    pub username: String,
    #[serde(skip_serializing)]
    pub password: Option<String>,
    pub full_name: String,
    pub email: String,
    pub phone: Option<String>,
    pub is_active: bool,
    pub creator_id: String,
    pub updater_id: Option<String>,
    pub create_date_time: chrono::NaiveDateTime,
    pub update_date_time: Option<chrono::NaiveDateTime>,
}

/// 创建用户请求参数
#[derive(Debug, Deserialize)]
pub struct CreateUserParams {
    pub username: String,
    pub password: String,
    pub full_name: String,
    pub email: String,
    pub phone: Option<String>,
    #[serde(default)]
    pub is_active: Option<bool>,
}

/// 更新用户请求参数
#[derive(Debug, Deserialize)]
pub struct UpdateUserParams {
    pub username: Option<String>,
    pub password: Option<String>,
    pub full_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub is_active: Option<bool>,
}

/// 用户查询参数
#[derive(Debug, Deserialize)]
pub struct UserQueryParams {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub username: Option<String>,
    pub full_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub is_active: Option<bool>,
}

/// 批量删除用户请求参数
#[derive(Debug, Deserialize)]
pub struct BatchDeleteUsersParams {
    pub ids: Vec<String>,
}

/// 切换用户状态请求参数
#[derive(Debug, Deserialize)]
pub struct ToggleUserStatusParams {
    pub is_active: bool,
}

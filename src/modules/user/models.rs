use crate::common::id::Id;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// 用户数据模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: Id,
    pub username: String,
    #[serde(skip_serializing)]
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

/// 创建用户请求参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
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
#[serde(rename_all = "camelCase")]
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
#[serde(rename_all = "camelCase")]
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
    pub ids: Vec<Id>,
}

/// 切换用户状态请求参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToggleUserStatusParams {
    pub is_active: bool,
}

/// 用于下拉选择的轻量用户信息
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct UserOption {
    pub id: Id,
    pub username: String,
    pub full_name: String,
    pub is_active: bool,
}

/// 用户下拉选项查询参数（支持分页 + keyword 模糊搜索）
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserOptionQueryParams {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    /// 关键字：同时匹配 username 或 full_name
    pub keyword: Option<String>,
    pub is_active: Option<bool>,
}

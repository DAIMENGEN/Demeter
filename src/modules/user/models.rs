use crate::common::id::Id;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// 用户角色枚举，对应数据库 user_role 类型
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "user_role", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum UserRole {
    SuperAdmin,
    Admin,
    User,
}

impl UserRole {
    /// 是否为管理员级别（super_admin 或 admin）
    pub fn is_admin(&self) -> bool {
        matches!(self, UserRole::SuperAdmin | UserRole::Admin)
    }

    /// 是否为超级管理员
    #[allow(unused)]
    pub fn is_super_admin(&self) -> bool {
        matches!(self, UserRole::SuperAdmin)
    }
}

impl std::fmt::Display for UserRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            UserRole::SuperAdmin => write!(f, "super_admin"),
            UserRole::Admin => write!(f, "admin"),
            UserRole::User => write!(f, "user"),
        }
    }
}

/// 用户完整信息（users 表 + 组织关系 JOIN）
///
/// 所有面向前端的查询统一返回此结构，包含部门 / 团队的 ID 及名称。
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: Id,
    pub username: String,
    #[allow(unused)]
    #[serde(skip_serializing)]
    pub password: Option<String>,
    pub full_name: String,
    pub email: String,
    pub phone: Option<String>,
    pub role: UserRole,
    pub is_active: bool,
    // ── 组织关系（LEFT JOIN user_departments / departments / user_teams / teams） ──
    pub department_id: Option<Id>,
    pub department_name: Option<String>,
    pub team_ids: Vec<Id>,
    pub team_names: Vec<String>,
    // ── 审计字段 ──
    pub creator_id: Id,
    pub updater_id: Option<Id>,
    pub create_date_time: chrono::NaiveDateTime,
    pub update_date_time: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateUserParams {
    pub username: String,
    pub password: String,
    pub full_name: String,
    pub email: String,
    pub phone: Option<String>,
    pub department_id: Option<Id>,
    pub team_ids: Option<Vec<Id>>,
    #[serde(default)]
    pub is_active: Option<bool>,
    /// 角色，不传则默认为 user
    pub role: Option<UserRole>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserParams {
    pub username: Option<String>,
    pub password: Option<String>,
    pub full_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub is_active: Option<bool>,
    pub role: Option<UserRole>,
    /// None = 未传（不变）, Some(None) = 传了 null（清除）, Some(Some(id)) = 传了值（设置）
    #[serde(default, deserialize_with = "crate::common::serde_helpers::double_option::deserialize")]
    pub department_id: Option<Option<Id>>,
    /// None = 未传（不变）, Some(vec![]) = 清除所有团队, Some(vec![...]) = 设置团队列表
    pub team_ids: Option<Vec<Id>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserQueryParams {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    /// 模糊搜索关键词，同时匹配 username 和 full_name（OR 逻辑）
    pub keyword: Option<String>,
    pub username: Option<String>,
    pub full_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub is_active: Option<bool>,
    pub department_id: Option<i64>,
    pub team_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct BatchDeleteUsersParams {
    pub ids: Vec<Id>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToggleUserStatusParams {
    pub is_active: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResetPasswordResponse {
    pub temporary_password: String,
}

/// 用户自行修改个人资料的参数（不含管理字段如 is_active / department / team）。
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProfileParams {
    pub full_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
}



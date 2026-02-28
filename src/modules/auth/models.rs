use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::common::id::Id;
use crate::modules::user::models::User;

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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthResponse {
    pub user: UserInfo,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UserInfo {
    pub id: Id,
    pub username: String,
    pub full_name: String,
    pub email: String,
    pub phone: Option<String>,
    pub is_active: bool,
    pub create_date_time: chrono::NaiveDateTime,
}

impl From<User> for UserInfo {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            is_active: user.is_active,
            create_date_time: user.create_date_time,
        }
    }
}

#[derive(Debug, FromRow)]
pub struct RefreshToken {
    pub id: i64,
    pub user_id: i64,
    pub token: String,
    pub expires_at: chrono::NaiveDateTime,
    pub created_at: chrono::NaiveDateTime,
}

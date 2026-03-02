use crate::common::error::AppResult;
use crate::modules::auth::models::{AuthUser, RefreshToken};
use sqlx::PgPool;

pub struct AuthRepository;

impl AuthRepository {
    pub async fn get_user_by_username_for_auth(
        pool: &PgPool,
        username: &str,
    ) -> AppResult<Option<AuthUser>> {
        let user = sqlx::query_as::<_, AuthUser>(
            r#"
            SELECT id, username, password, full_name, email, phone, is_active,
                   creator_id, updater_id, create_date_time, update_date_time
            FROM users
            WHERE username = $1
            "#,
        )
        .bind(username)
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    pub async fn check_email_exists(pool: &PgPool, email: &str) -> AppResult<bool> {
        let result: (bool,) = sqlx::query_as(
            r#"
            SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)
            "#,
        )
        .bind(email)
        .fetch_one(pool)
        .await?;

        Ok(result.0)
    }

    pub async fn check_username_exists(pool: &PgPool, username: &str) -> AppResult<bool> {
        let result: (bool,) = sqlx::query_as(
            r#"
            SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)
            "#,
        )
        .bind(username)
        .fetch_one(pool)
        .await?;

        Ok(result.0)
    }

    pub async fn create_user(
        pool: &PgPool,
        user_id: i64,
        username: &str,
        password_hash: &str,
        full_name: &str,
        email: &str,
        phone: Option<&str>,
    ) -> AppResult<AuthUser> {
        let user = sqlx::query_as::<_, AuthUser>(
            r#"
            INSERT INTO users (id, username, password, full_name, email, phone, is_active, creator_id, create_date_time)
            VALUES ($1, $2, $3, $4, $5, $6, true, $1, NOW())
            RETURNING id, username, password, full_name, email, phone, is_active, creator_id, updater_id, create_date_time, update_date_time
            "#
        )
        .bind(user_id)
        .bind(username)
        .bind(password_hash)
        .bind(full_name)
        .bind(email)
        .bind(phone)
        .fetch_one(pool)
        .await?;

        Ok(user)
    }

    pub async fn save_refresh_token(
        pool: &PgPool,
        id: i64,
        user_id: i64,
        token: &str,
        expires_at: chrono::NaiveDateTime,
    ) -> AppResult<()> {
        sqlx::query(
            r#"
            INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            "#,
        )
        .bind(id)
        .bind(user_id)
        .bind(token)
        .bind(expires_at)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn verify_refresh_token(
        pool: &PgPool,
        token: &str,
    ) -> AppResult<Option<RefreshToken>> {
        let refresh_token = sqlx::query_as::<_, RefreshToken>(
            r#"
            SELECT id, user_id, token, expires_at, created_at
            FROM refresh_tokens
            WHERE token = $1 AND expires_at > NOW()
            "#,
        )
        .bind(token)
        .fetch_optional(pool)
        .await?;

        Ok(refresh_token)
    }

    pub async fn delete_refresh_token(pool: &PgPool, token: &str) -> AppResult<()> {
        sqlx::query(
            r#"
            DELETE FROM refresh_tokens
            WHERE token = $1
            "#,
        )
        .bind(token)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn delete_user_refresh_tokens(pool: &PgPool, user_id: i64) -> AppResult<()> {
        sqlx::query(
            r#"
            DELETE FROM refresh_tokens
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn cleanup_expired_tokens(pool: &PgPool) -> AppResult<u64> {
        let result = sqlx::query(
            r#"
            DELETE FROM refresh_tokens
            WHERE expires_at <= NOW()
            "#,
        )
        .execute(pool)
        .await?;

        Ok(result.rows_affected())
    }

    /// 根据用户 ID 查询内部 AuthUser（仅 users 表，不 JOIN 组织关系）。
    ///
    /// 用于 refresh / session 等场景中校验用户是否存在与 is_active 状态。
    pub async fn get_auth_user_by_id(pool: &PgPool, user_id: i64) -> AppResult<Option<AuthUser>> {
        let user = sqlx::query_as::<_, AuthUser>(
            r#"
            SELECT id, username, password, full_name, email, phone, is_active,
                   creator_id, updater_id, create_date_time, update_date_time
            FROM users
            WHERE id = $1
            "#,
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }
}

use crate::common::error::AppResult;
use crate::modules::user::models::{CreateUserParams, UpdateUserParams, User, UserQueryParams};
use sqlx::PgPool;

/// 用户数据访问层
pub struct UserRepository;

impl UserRepository {
    /// 获取用户列表（分页）
    pub async fn get_user_list(
        pool: &PgPool,
        params: UserQueryParams,
    ) -> AppResult<(Vec<User>, i64)> {
        let page = params.page.unwrap_or(1);
        let page_size = params.page_size.unwrap_or(10);
        let offset = (page - 1) * page_size;

        let username_pattern = params.username.as_ref().map(|u| format!("%{}%", u));
        let full_name_pattern = params.full_name.as_ref().map(|f| format!("%{}%", f));
        let email_pattern = params.email.as_ref().map(|e| format!("%{}%", e));
        let phone_pattern = params.phone.as_ref().map(|p| format!("%{}%", p));

        let users = sqlx::query_as::<_, User>(
            r#"
            SELECT id, username, password, full_name, email, phone, is_active,
                   creator_id, updater_id, create_date_time, update_date_time
            FROM users
            WHERE ($1::TEXT IS NULL OR username ILIKE $1)
              AND ($2::TEXT IS NULL OR full_name ILIKE $2)
              AND ($3::TEXT IS NULL OR email ILIKE $3)
              AND ($4::TEXT IS NULL OR phone ILIKE $4)
              AND ($5::BOOLEAN IS NULL OR is_active = $5)
            ORDER BY create_date_time DESC
            LIMIT $6 OFFSET $7
            "#,
        )
        .bind(&username_pattern)
        .bind(&full_name_pattern)
        .bind(&email_pattern)
        .bind(&phone_pattern)
        .bind(params.is_active)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        let total: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*)
            FROM users
            WHERE ($1::TEXT IS NULL OR username ILIKE $1)
              AND ($2::TEXT IS NULL OR full_name ILIKE $2)
              AND ($3::TEXT IS NULL OR email ILIKE $3)
              AND ($4::TEXT IS NULL OR phone ILIKE $4)
              AND ($5::BOOLEAN IS NULL OR is_active = $5)
            "#,
        )
        .bind(&username_pattern)
        .bind(&full_name_pattern)
        .bind(&email_pattern)
        .bind(&phone_pattern)
        .bind(params.is_active)
        .fetch_one(pool)
        .await?;

        Ok((users, total.0))
    }

    /// 获取所有用户（不分页）
    pub async fn get_all_users(pool: &PgPool, params: UserQueryParams) -> AppResult<Vec<User>> {
        let username_pattern = params.username.as_ref().map(|u| format!("%{}%", u));
        let full_name_pattern = params.full_name.as_ref().map(|f| format!("%{}%", f));
        let email_pattern = params.email.as_ref().map(|e| format!("%{}%", e));

        let users = sqlx::query_as::<_, User>(
            r#"
            SELECT id, username, password, full_name, email, phone, is_active,
                   creator_id, updater_id, create_date_time, update_date_time
            FROM users
            WHERE ($1::TEXT IS NULL OR username ILIKE $1)
              AND ($2::TEXT IS NULL OR full_name ILIKE $2)
              AND ($3::TEXT IS NULL OR email ILIKE $3)
              AND ($4::BOOLEAN IS NULL OR is_active = $4)
            ORDER BY create_date_time DESC
            "#,
        )
        .bind(&username_pattern)
        .bind(&full_name_pattern)
        .bind(&email_pattern)
        .bind(params.is_active)
        .fetch_all(pool)
        .await?;

        Ok(users)
    }

    /// 根据 ID 获取用户
    pub async fn get_user_by_id(pool: &PgPool, id: i64) -> AppResult<Option<User>> {
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT id, username, password, full_name, email, phone, is_active,
                   creator_id, updater_id, create_date_time, update_date_time
            FROM users
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    /// 根据用户名获取用户
    pub async fn get_user_by_username(pool: &PgPool, username: &str) -> AppResult<Option<User>> {
        let user = sqlx::query_as::<_, User>(
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

    /// 创建用户
    pub async fn create_user(
        pool: &PgPool,
        id: i64,
        params: CreateUserParams,
        creator_id: i64,
    ) -> AppResult<User> {
        let is_active = params.is_active.unwrap_or(true);
        let user = sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (id, username, password, full_name, email, phone, is_active, creator_id, create_date_time)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING id, username, password, full_name, email, phone, is_active, creator_id, updater_id, create_date_time, update_date_time
            "#
        )
        .bind(id)
        .bind(&params.username)
        .bind(&params.password)
        .bind(&params.full_name)
        .bind(&params.email)
        .bind(&params.phone)
        .bind(is_active)
        .bind(creator_id)
        .fetch_one(pool)
        .await?;

        Ok(user)
    }

    /// 更新用户
    pub async fn update_user(
        pool: &PgPool,
        id: i64,
        params: UpdateUserParams,
        updater_id: i64,
    ) -> AppResult<Option<User>> {
        // 首先检查用户是否存在
        let existing = Self::get_user_by_id(pool, id).await?;
        if existing.is_none() {
            return Ok(None);
        }

        let user = sqlx::query_as::<_, User>(
            r#"
            UPDATE users
            SET username = COALESCE($2, username),
                password = COALESCE($3, password),
                full_name = COALESCE($4, full_name),
                email = COALESCE($5, email),
                phone = COALESCE($6, phone),
                is_active = COALESCE($7, is_active),
                updater_id = $8,
                update_date_time = NOW()
            WHERE id = $1
            RETURNING id, username, password, full_name, email, phone, is_active, creator_id, updater_id, create_date_time, update_date_time
            "#
        )
        .bind(id)
        .bind(&params.username)
        .bind(&params.password)
        .bind(&params.full_name)
        .bind(&params.email)
        .bind(&params.phone)
        .bind(&params.is_active)
        .bind(updater_id)
        .fetch_one(pool)
        .await?;

        Ok(Some(user))
    }

    /// 删除用户
    pub async fn delete_user(pool: &PgPool, id: i64) -> AppResult<bool> {
        let result = sqlx::query(
            r#"
            DELETE FROM users
            WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// 批量删除用户
    pub async fn batch_delete_users(pool: &PgPool, ids: Vec<i64>) -> AppResult<u64> {
        let result = sqlx::query(
            r#"
            DELETE FROM users
            WHERE id = ANY($1)
            "#,
        )
        .bind(&ids)
        .execute(pool)
        .await?;

        Ok(result.rows_affected())
    }

    /// 切换用户状态
    pub async fn toggle_user_status(
        pool: &PgPool,
        id: i64,
        is_active: bool,
        updater_id: i64,
    ) -> AppResult<Option<User>> {
        let user = sqlx::query_as::<_, User>(
            r#"
            UPDATE users
            SET is_active = $2,
                updater_id = $3,
                update_date_time = NOW()
            WHERE id = $1
            RETURNING id, username, password, full_name, email, phone, is_active, creator_id, updater_id, create_date_time, update_date_time
            "#
        )
        .bind(id)
        .bind(is_active)
        .bind(updater_id)
        .fetch_optional(pool)
        .await?;

        Ok(user)
    }

    /// 获取用户下拉选项（分页，轻量字段）
    pub async fn get_user_options(
        pool: &PgPool,
        page: i64,
        page_size: i64,
        keyword: Option<String>,
        is_active: Option<bool>,
    ) -> AppResult<(Vec<crate::modules::user::models::UserOption>, i64)> {
        use crate::modules::user::models::UserOption;

        let page = if page < 1 { 1 } else { page };
        let page_size = if page_size < 1 { 10 } else { page_size };
        let offset = (page - 1) * page_size;

        let keyword_pattern = keyword.as_ref().map(|k| format!("%{}%", k));

        let list = sqlx::query_as::<_, UserOption>(
            r#"
            SELECT id, username, full_name, is_active
            FROM users
            WHERE ($1::BOOLEAN IS NULL OR is_active = $1)
              AND ($2::TEXT IS NULL OR username ILIKE $2 OR full_name ILIKE $2)
            ORDER BY create_date_time DESC
            LIMIT $3 OFFSET $4
            "#,
        )
        .bind(is_active)
        .bind(&keyword_pattern)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        let total: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*)
            FROM users
            WHERE ($1::BOOLEAN IS NULL OR is_active = $1)
              AND ($2::TEXT IS NULL OR username ILIKE $2 OR full_name ILIKE $2)
            "#,
        )
        .bind(is_active)
        .bind(&keyword_pattern)
        .fetch_one(pool)
        .await?;

        Ok((list, total.0))
    }
}

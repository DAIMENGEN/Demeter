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

        // 构建查询条件
        let mut query = String::from(
            "SELECT id, username, password, full_name, email, phone, is_active,
             creator_id, updater_id, create_date_time, update_date_time
             FROM users WHERE 1=1",
        );
        let mut count_query = String::from("SELECT COUNT(*) FROM users WHERE 1=1");

        if let Some(username) = &params.username {
            query.push_str(&format!(" AND username ILIKE '%{}%'", username));
            count_query.push_str(&format!(" AND username ILIKE '%{}%'", username));
        }

        if let Some(full_name) = &params.full_name {
            query.push_str(&format!(" AND full_name ILIKE '%{}%'", full_name));
            count_query.push_str(&format!(" AND full_name ILIKE '%{}%'", full_name));
        }

        if let Some(email) = &params.email {
            query.push_str(&format!(" AND email ILIKE '%{}%'", email));
            count_query.push_str(&format!(" AND email ILIKE '%{}%'", email));
        }

        if let Some(phone) = &params.phone {
            query.push_str(&format!(" AND phone ILIKE '%{}%'", phone));
            count_query.push_str(&format!(" AND phone ILIKE '%{}%'", phone));
        }

        if let Some(is_active) = params.is_active {
            query.push_str(&format!(" AND is_active = {}", is_active));
            count_query.push_str(&format!(" AND is_active = {}", is_active));
        }

        query.push_str(&format!(
            " ORDER BY create_date_time DESC LIMIT {} OFFSET {}",
            page_size, offset
        ));

        let users = sqlx::query_as::<_, User>(&query).fetch_all(pool).await?;

        let total: (i64,) = sqlx::query_as(&count_query).fetch_one(pool).await?;

        Ok((users, total.0))
    }

    /// 获取所有用户（不分页）
    pub async fn get_all_users(pool: &PgPool, params: UserQueryParams) -> AppResult<Vec<User>> {
        let mut query = String::from(
            "SELECT id, username, password, full_name, email, phone, is_active,
             creator_id, updater_id, create_date_time, update_date_time
             FROM users WHERE 1=1",
        );

        if let Some(username) = &params.username {
            query.push_str(&format!(" AND username ILIKE '%{}%'", username));
        }

        if let Some(full_name) = &params.full_name {
            query.push_str(&format!(" AND full_name ILIKE '%{}%'", full_name));
        }

        if let Some(email) = &params.email {
            query.push_str(&format!(" AND email ILIKE '%{}%'", email));
        }

        if let Some(is_active) = params.is_active {
            query.push_str(&format!(" AND is_active = {}", is_active));
        }

        query.push_str(" ORDER BY create_date_time DESC");

        let users = sqlx::query_as::<_, User>(&query).fetch_all(pool).await?;

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
}

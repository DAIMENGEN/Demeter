use crate::common::error::AppResult;
use crate::modules::user::models::{
    CreateUserParams, UpdateProfileParams, UpdateUserParams, User, UserQueryParams,
};
use sqlx::PgPool;

pub struct UserRepository;

// ──────────────── 基础查询（users 表 + 组织关系 JOIN） ────────────────

/// SELECT 列：users 表 + departments LEFT JOIN（取部门名称）+ teams ARRAY 子查询（取团队 ID 与名称）
const USER_COLUMNS: &str = r#"
    u.id,
    u.username,
    u.password,
    u.full_name,
    u.email,
    u.phone,
    u.is_active,
    ud.department_id,
    d.department_name,
    ARRAY(SELECT ut.team_id FROM user_teams ut WHERE ut.user_id = u.id) AS team_ids,
    ARRAY(SELECT t.team_name FROM user_teams ut JOIN teams t ON t.id = ut.team_id WHERE ut.user_id = u.id) AS team_names,
    u.creator_id,
    u.updater_id,
    u.create_date_time,
    u.update_date_time
"#;

/// FROM + JOIN 子句：所有查询共用
const USER_FROM_JOINS: &str = r#"
    FROM users u
    LEFT JOIN user_departments ud ON ud.user_id = u.id
    LEFT JOIN departments d ON d.id = ud.department_id
"#;

impl UserRepository {
    // ─── 列表 / 全量 / 详情 ───

    pub async fn get_user_list(
        pool: &PgPool,
        params: UserQueryParams,
    ) -> AppResult<(Vec<User>, i64)> {
        let page = params.page.unwrap_or(1);
        let page_size = params.page_size.unwrap_or(10);
        let offset = (page - 1) * page_size;
        let keyword_pattern = params.keyword.as_ref().map(|k| format!("%{}%", k));
        let username_pattern = params.username.as_ref().map(|u| format!("%{}%", u));
        let full_name_pattern = params.full_name.as_ref().map(|f| format!("%{}%", f));
        let email_pattern = params.email.as_ref().map(|e| format!("%{}%", e));
        let phone_pattern = params.phone.as_ref().map(|p| format!("%{}%", p));

        let sql = format!(
            r#"
            SELECT {columns}
            {from_joins}
            WHERE ($1::TEXT IS NULL OR u.username ILIKE $1 OR u.full_name ILIKE $1)
              AND ($2::TEXT IS NULL OR u.username ILIKE $2)
              AND ($3::TEXT IS NULL OR u.full_name ILIKE $3)
              AND ($4::TEXT IS NULL OR u.email ILIKE $4)
              AND ($5::TEXT IS NULL OR u.phone ILIKE $5)
              AND ($6::BOOLEAN IS NULL OR u.is_active = $6)
              AND ($7::BIGINT IS NULL OR ud.department_id = $7)
              AND ($8::BIGINT IS NULL OR EXISTS (
                    SELECT 1 FROM user_teams ut2 WHERE ut2.user_id = u.id AND ut2.team_id = $8
              ))
            ORDER BY u.create_date_time DESC
            LIMIT $9 OFFSET $10
            "#,
            columns = USER_COLUMNS,
            from_joins = USER_FROM_JOINS,
        );

        let users = sqlx::query_as::<_, User>(&sql)
            .bind(&keyword_pattern)
            .bind(&username_pattern)
            .bind(&full_name_pattern)
            .bind(&email_pattern)
            .bind(&phone_pattern)
            .bind(params.is_active)
            .bind(params.department_id)
            .bind(params.team_id)
            .bind(page_size)
            .bind(offset)
            .fetch_all(pool)
            .await?;

        let total: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*)
            FROM users u
            LEFT JOIN user_departments ud ON ud.user_id = u.id
            WHERE ($1::TEXT IS NULL OR u.username ILIKE $1 OR u.full_name ILIKE $1)
              AND ($2::TEXT IS NULL OR u.username ILIKE $2)
              AND ($3::TEXT IS NULL OR u.full_name ILIKE $3)
              AND ($4::TEXT IS NULL OR u.email ILIKE $4)
              AND ($5::TEXT IS NULL OR u.phone ILIKE $5)
              AND ($6::BOOLEAN IS NULL OR u.is_active = $6)
              AND ($7::BIGINT IS NULL OR ud.department_id = $7)
              AND ($8::BIGINT IS NULL OR EXISTS (
                    SELECT 1 FROM user_teams ut2 WHERE ut2.user_id = u.id AND ut2.team_id = $8
              ))
            "#,
        )
        .bind(&keyword_pattern)
        .bind(&username_pattern)
        .bind(&full_name_pattern)
        .bind(&email_pattern)
        .bind(&phone_pattern)
        .bind(params.is_active)
        .bind(params.department_id)
        .bind(params.team_id)
        .fetch_one(pool)
        .await?;

        Ok((users, total.0))
    }

    pub async fn get_all_users(
        pool: &PgPool,
        params: UserQueryParams,
    ) -> AppResult<Vec<User>> {
        let keyword_pattern = params.keyword.as_ref().map(|k| format!("%{}%", k));
        let username_pattern = params.username.as_ref().map(|u| format!("%{}%", u));
        let full_name_pattern = params.full_name.as_ref().map(|f| format!("%{}%", f));
        let email_pattern = params.email.as_ref().map(|e| format!("%{}%", e));
        let phone_pattern = params.phone.as_ref().map(|p| format!("%{}%", p));

        let sql = format!(
            r#"
            SELECT {columns}
            {from_joins}
            WHERE ($1::TEXT IS NULL OR u.username ILIKE $1 OR u.full_name ILIKE $1)
              AND ($2::TEXT IS NULL OR u.username ILIKE $2)
              AND ($3::TEXT IS NULL OR u.full_name ILIKE $3)
              AND ($4::TEXT IS NULL OR u.email ILIKE $4)
              AND ($5::TEXT IS NULL OR u.phone ILIKE $5)
              AND ($6::BOOLEAN IS NULL OR u.is_active = $6)
              AND ($7::BIGINT IS NULL OR ud.department_id = $7)
              AND ($8::BIGINT IS NULL OR EXISTS (
                    SELECT 1 FROM user_teams ut2 WHERE ut2.user_id = u.id AND ut2.team_id = $8
              ))
            ORDER BY u.create_date_time DESC
            "#,
            columns = USER_COLUMNS,
            from_joins = USER_FROM_JOINS,
        );

        let users = sqlx::query_as::<_, User>(&sql)
            .bind(&keyword_pattern)
            .bind(&username_pattern)
            .bind(&full_name_pattern)
            .bind(&email_pattern)
            .bind(&phone_pattern)
            .bind(params.is_active)
            .bind(params.department_id)
            .bind(params.team_id)
            .fetch_all(pool)
            .await?;

        Ok(users)
    }

    /// 按 ID 查询用户完整信息（含组织关系与名称）
    pub async fn get_user_by_id(pool: &PgPool, id: i64) -> AppResult<Option<User>> {
        let sql = format!(
            r#"
            SELECT {columns}
            {from_joins}
            WHERE u.id = $1
            "#,
            columns = USER_COLUMNS,
            from_joins = USER_FROM_JOINS,
        );
        let user = sqlx::query_as::<_, User>(&sql)
            .bind(id)
            .fetch_optional(pool)
            .await?;
        Ok(user)
    }

    /// 按用户名查询用户完整信息（含组织关系与名称）
    pub async fn get_user_by_username(pool: &PgPool, username: &str) -> AppResult<Option<User>> {
        let sql = format!(
            r#"
            SELECT {columns}
            {from_joins}
            WHERE u.username = $1
            "#,
            columns = USER_COLUMNS,
            from_joins = USER_FROM_JOINS,
        );
        let user = sqlx::query_as::<_, User>(&sql)
            .bind(username)
            .fetch_optional(pool)
            .await?;
        Ok(user)
    }

    // ─── 创建 ───

    pub async fn create_user(
        pool: &PgPool,
        id: i64,
        params: CreateUserParams,
        password_hash: &str,
        creator_id: i64,
        generate_id: impl Fn() -> Result<i64, crate::common::snowflake::SnowflakeError>,
    ) -> AppResult<User> {
        let is_active = params.is_active.unwrap_or(true);

        // 1. 插入 users 表
        sqlx::query(
            r#"
            INSERT INTO users (id, username, password, full_name, email, phone, is_active, creator_id, create_date_time)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            "#,
        )
        .bind(id)
        .bind(&params.username)
        .bind(password_hash)
        .bind(&params.full_name)
        .bind(&params.email)
        .bind(&params.phone)
        .bind(is_active)
        .bind(creator_id)
        .execute(pool)
        .await?;

        // 2. 插入 user_departments
        if let Some(dept_id) = params.department_id {
            let rel_id = generate_id().map_err(|e| {
                crate::common::error::AppError::InternalError(format!("Failed to generate ID: {}", e))
            })?;
            sqlx::query(
                r#"INSERT INTO user_departments (id, user_id, department_id, creator_id) VALUES ($1, $2, $3, $4)"#,
            )
            .bind(rel_id)
            .bind(id)
            .bind(dept_id.0)
            .bind(creator_id)
            .execute(pool)
            .await?;
        }

        // 3. 插入 user_teams
        if let Some(team_ids) = &params.team_ids {
            for tid in team_ids {
                let rel_id = generate_id().map_err(|e| {
                    crate::common::error::AppError::InternalError(format!("Failed to generate ID: {}", e))
                })?;
                sqlx::query(
                    r#"INSERT INTO user_teams (id, user_id, team_id, creator_id) VALUES ($1, $2, $3, $4)"#,
                )
                .bind(rel_id)
                .bind(id)
                .bind(tid.0)
                .bind(creator_id)
                .execute(pool)
                .await?;
            }
        }

        // 4. 返回完整 User（含组织关系）
        Self::get_user_by_id(pool, id)
            .await?
            .ok_or_else(|| {
                crate::common::error::AppError::InternalError(
                    "User just created but not found".to_string(),
                )
            })
    }

    // ─── 更新 ───

    pub async fn update_user(
        pool: &PgPool,
        id: i64,
        params: UpdateUserParams,
        password_hash: Option<&str>,
        updater_id: i64,
        generate_id: impl Fn() -> Result<i64, crate::common::snowflake::SnowflakeError>,
    ) -> AppResult<Option<User>> {
        // 检查用户是否存在
        if Self::get_user_by_id(pool, id).await?.is_none() {
            return Ok(None);
        }

        // 1. 更新 users 表基础字段
        sqlx::query(
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
            "#,
        )
        .bind(id)
        .bind(&params.username)
        .bind(password_hash)
        .bind(&params.full_name)
        .bind(&params.email)
        .bind(&params.phone)
        .bind(&params.is_active)
        .bind(updater_id)
        .execute(pool)
        .await?;

        // 2. 更新 user_departments（如果前端传了该字段）
        if let Some(dept_opt) = &params.department_id {
            // 先删除旧关系
            sqlx::query(r#"DELETE FROM user_departments WHERE user_id = $1"#)
                .bind(id)
                .execute(pool)
                .await?;
            // 如果传了新部门，则插入
            if let Some(dept_id) = dept_opt {
                let rel_id = generate_id().map_err(|e| {
                    crate::common::error::AppError::InternalError(format!("Failed to generate ID: {}", e))
                })?;
                sqlx::query(
                    r#"INSERT INTO user_departments (id, user_id, department_id, creator_id) VALUES ($1, $2, $3, $4)"#,
                )
                .bind(rel_id)
                .bind(id)
                .bind(dept_id.0)
                .bind(updater_id)
                .execute(pool)
                .await?;
            }
        }

        // 3. 更新 user_teams（如果前端传了该字段）
        if let Some(team_ids) = &params.team_ids {
            // 先删除旧关系
            sqlx::query(r#"DELETE FROM user_teams WHERE user_id = $1"#)
                .bind(id)
                .execute(pool)
                .await?;
            // 插入新关系
            for tid in team_ids {
                let rel_id = generate_id().map_err(|e| {
                    crate::common::error::AppError::InternalError(format!("Failed to generate ID: {}", e))
                })?;
                sqlx::query(
                    r#"INSERT INTO user_teams (id, user_id, team_id, creator_id) VALUES ($1, $2, $3, $4)"#,
                )
                .bind(rel_id)
                .bind(id)
                .bind(tid.0)
                .bind(updater_id)
                .execute(pool)
                .await?;
            }
        }

        Self::get_user_by_id(pool, id).await
    }

    // ─── 更新个人资料（用户自助） ───

    /// 用户修改自己的个人资料，仅允许 full_name / email / phone。
    pub async fn update_profile(
        pool: &PgPool,
        id: i64,
        params: UpdateProfileParams,
    ) -> AppResult<Option<User>> {
        let result = sqlx::query(
            r#"
            UPDATE users
            SET full_name = COALESCE($2, full_name),
                email = COALESCE($3, email),
                phone = COALESCE($4, phone),
                updater_id = $1,
                update_date_time = NOW()
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(&params.full_name)
        .bind(&params.email)
        .bind(&params.phone)
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Ok(None);
        }

        Self::get_user_by_id(pool, id).await
    }

    // ─── 重置密码 ───

    pub async fn reset_password(
        pool: &PgPool,
        id: i64,
        password_hash: &str,
        updater_id: i64,
    ) -> AppResult<bool> {
        let result = sqlx::query(
            r#"
            UPDATE users
            SET password = $2,
                updater_id = $3,
                update_date_time = NOW()
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(password_hash)
        .bind(updater_id)
        .execute(pool)
        .await?;
        Ok(result.rows_affected() > 0)
    }

    // ─── 删除 ───

    pub async fn delete_user(pool: &PgPool, id: i64) -> AppResult<bool> {
        // 关系表会因 ON DELETE CASCADE 自动清理
        let result = sqlx::query(r#"DELETE FROM users WHERE id = $1"#)
            .bind(id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn batch_delete_users(pool: &PgPool, ids: Vec<i64>) -> AppResult<u64> {
        let result = sqlx::query(r#"DELETE FROM users WHERE id = ANY($1)"#)
            .bind(&ids)
            .execute(pool)
            .await?;
        Ok(result.rows_affected())
    }

    // ─── 切换状态 ───

    pub async fn toggle_user_status(
        pool: &PgPool,
        id: i64,
        is_active: bool,
        updater_id: i64,
    ) -> AppResult<Option<User>> {
        let result = sqlx::query(
            r#"
            UPDATE users
            SET is_active = $2,
                updater_id = $3,
                update_date_time = NOW()
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(is_active)
        .bind(updater_id)
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Ok(None);
        }

        Self::get_user_by_id(pool, id).await
    }
}

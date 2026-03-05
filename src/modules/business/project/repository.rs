use crate::common::error::AppResult;
use crate::modules::business::project::models::{
    CreateProjectParams, Project, ProjectQueryParams, RecentlyVisitedQueryParams,
    UpdateProjectParams,
};
use sqlx::PgPool;
use sqlx::QueryBuilder;

pub struct ProjectVisitRepository;

pub struct ProjectRepository;

/// projects 表 SELECT 列
const PROJECT_COLUMNS: &str = r#"id, project_name, description, start_date_time, end_date_time, 
    project_status, version, "order", creator_id, updater_id, 
    create_date_time, update_date_time"#;

/// projects 表 RETURNING 列
const PROJECT_RETURNING: &str = r#" RETURNING id, project_name, description, start_date_time, end_date_time, 
    project_status, version, "order", creator_id, updater_id, 
    create_date_time, update_date_time"#;

impl ProjectRepository {
    pub async fn get_project_list(
        pool: &PgPool,
        params: ProjectQueryParams,
    ) -> AppResult<(Vec<Project>, i64)> {
        let page = params.page.unwrap_or(1);
        let page_size = params.per_page.unwrap_or(10);
        let offset = (page - 1) * page_size;
        let project_name_pattern = params.project_name.as_ref().map(|p| format!("%{}%", p));
        let projects = sqlx::query_as::<_, Project>(
            &format!(
                r#"
                SELECT {}
                FROM projects
                WHERE ($1::TEXT IS NULL OR project_name ILIKE $1)
                  AND ($2::SMALLINT IS NULL OR project_status = $2)
                  AND ($3::TIMESTAMP IS NULL OR start_date_time >= $3)
                  AND ($4::TIMESTAMP IS NULL OR end_date_time <= $4)
                ORDER BY "order" ASC NULLS LAST, create_date_time DESC
                LIMIT $5 OFFSET $6
                "#,
                PROJECT_COLUMNS,
            ),
        )
        .bind(&project_name_pattern)
        .bind(params.project_status)
        .bind(params.start_date_time)
        .bind(params.end_date_time)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        let total: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*)
            FROM projects
            WHERE ($1::TEXT IS NULL OR project_name ILIKE $1)
              AND ($2::SMALLINT IS NULL OR project_status = $2)
              AND ($3::TIMESTAMP IS NULL OR start_date_time >= $3)
              AND ($4::TIMESTAMP IS NULL OR end_date_time <= $4)
            "#,
        )
        .bind(&project_name_pattern)
        .bind(params.project_status)
        .bind(params.start_date_time)
        .bind(params.end_date_time)
        .fetch_one(pool)
        .await?;

        Ok((projects, total.0))
    }

    pub async fn get_all_projects(
        pool: &PgPool,
        params: ProjectQueryParams,
    ) -> AppResult<Vec<Project>> {
        let project_name_pattern = params.project_name.as_ref().map(|p| format!("%{}%", p));
        let projects = sqlx::query_as::<_, Project>(
            &format!(
                r#"
                SELECT {}
                FROM projects
                WHERE ($1::TEXT IS NULL OR project_name ILIKE $1)
                  AND ($2::SMALLINT IS NULL OR project_status = $2)
                  AND ($3::TIMESTAMP IS NULL OR start_date_time >= $3)
                  AND ($4::TIMESTAMP IS NULL OR end_date_time <= $4)
                ORDER BY "order" ASC NULLS LAST, create_date_time DESC
                "#,
                PROJECT_COLUMNS,
            ),
        )
        .bind(&project_name_pattern)
        .bind(params.project_status)
        .bind(params.start_date_time)
        .bind(params.end_date_time)
        .fetch_all(pool)
        .await?;

        Ok(projects)
    }

    pub async fn get_project_by_id(pool: &PgPool, project_id: i64) -> AppResult<Option<Project>> {
        let project = sqlx::query_as::<_, Project>(
            &format!(
                "SELECT {} FROM projects WHERE id = $1",
                PROJECT_COLUMNS,
            ),
        )
        .bind(project_id)
        .fetch_optional(pool)
        .await?;

        Ok(project)
    }

    pub async fn get_project_by_name(
        pool: &PgPool,
        project_name: &str,
    ) -> AppResult<Option<Project>> {
        let project = sqlx::query_as::<_, Project>(
            &format!(
                "SELECT {} FROM projects WHERE project_name = $1",
                PROJECT_COLUMNS,
            ),
        )
        .bind(project_name)
        .fetch_optional(pool)
        .await?;

        Ok(project)
    }

    pub async fn get_my_project_list(
        pool: &PgPool,
        creator_id: i64,
        params: ProjectQueryParams,
    ) -> AppResult<(Vec<Project>, i64)> {
        let page = params.page.unwrap_or(1);
        let page_size = params.per_page.unwrap_or(10);
        let offset = (page - 1) * page_size;
        let project_name_pattern = params.project_name.as_ref().map(|p| format!("%{}%", p));

        let projects = sqlx::query_as::<_, Project>(
            &format!(
                r#"
                SELECT {}
                FROM projects
                WHERE creator_id = $1
                  AND ($2::TEXT IS NULL OR project_name ILIKE $2)
                ORDER BY "order" ASC NULLS LAST, create_date_time DESC
                LIMIT $3 OFFSET $4
                "#,
                PROJECT_COLUMNS,
            ),
        )
        .bind(creator_id)
        .bind(&project_name_pattern)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        let total: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*)
            FROM projects
            WHERE creator_id = $1
              AND ($2::TEXT IS NULL OR project_name ILIKE $2)
            "#,
        )
        .bind(creator_id)
        .bind(&project_name_pattern)
        .fetch_one(pool)
        .await?;

        Ok((projects, total.0))
    }

    pub async fn get_my_all_projects(
        pool: &PgPool,
        creator_id: i64,
        params: ProjectQueryParams,
    ) -> AppResult<Vec<Project>> {
        let project_name_pattern = params.project_name.as_ref().map(|p| format!("%{}%", p));
        let projects = sqlx::query_as::<_, Project>(
            &format!(
                r#"
                SELECT {}
                FROM projects
                WHERE creator_id = $1
                  AND ($2::TEXT IS NULL OR project_name ILIKE $2)
                ORDER BY "order" ASC NULLS LAST, create_date_time DESC
                "#,
                PROJECT_COLUMNS,
            ),
        )
        .bind(creator_id)
        .bind(&project_name_pattern)
        .fetch_all(pool)
        .await?;

        Ok(projects)
    }

    pub async fn create_project(
        pool: &PgPool,
        project_id: i64,
        params: CreateProjectParams,
        creator_id: i64,
    ) -> AppResult<Project> {
        let sql = format!(
            r#"INSERT INTO projects (id, project_name, description, start_date_time, end_date_time,
                                 project_status, version, "order", creator_id, create_date_time)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()){}
            "#,
            PROJECT_RETURNING,
        );
        let project = sqlx::query_as::<_, Project>(&sql)
        .bind(project_id)
        .bind(&params.project_name)
        .bind(&params.description)
        .bind(&params.start_date_time)
        .bind(&params.end_date_time)
        .bind(params.project_status)
        .bind(params.version)
        .bind(params.order)
        .bind(creator_id)
        .fetch_one(pool)
        .await?;

        Ok(project)
    }

    pub async fn update_project(
        pool: &PgPool,
        project_id: i64,
        params: UpdateProjectParams,
        updater_id: i64,
    ) -> AppResult<Option<Project>> {
        // 动态构建 SET 子句，仅出现的字段才进入 SQL
        let mut qb: QueryBuilder<sqlx::Postgres> = QueryBuilder::new("UPDATE projects SET ");
        let mut has_set = false;

        // NOT NULL 字段：Option<T>，None = 不更新，Some(v) = 更新
        if let Some(ref name) = params.project_name {
            qb.push("project_name = ");
            qb.push_bind(name.clone());
            has_set = true;
        }

        // 可空字段：Option<Option<T>>，None = 不更新，Some(None) = 清空，Some(Some(v)) = 更新
        if let Some(ref desc_opt) = params.description {
            if has_set { qb.push(", "); }
            qb.push("description = ");
            qb.push_bind(desc_opt.clone());
            has_set = true;
        }

        if let Some(ref sdt) = params.start_date_time {
            if has_set { qb.push(", "); }
            qb.push("start_date_time = ");
            qb.push_bind(*sdt);
            has_set = true;
        }

        if let Some(ref edt_opt) = params.end_date_time {
            if has_set { qb.push(", "); }
            qb.push("end_date_time = ");
            qb.push_bind(*edt_opt);
            has_set = true;
        }

        if let Some(ref status) = params.project_status {
            if has_set { qb.push(", "); }
            qb.push("project_status = ");
            qb.push_bind(*status);
            has_set = true;
        }

        if let Some(ref ver_opt) = params.version {
            if has_set { qb.push(", "); }
            qb.push("version = ");
            qb.push_bind(*ver_opt);
            has_set = true;
        }

        if let Some(ref ord_opt) = params.order {
            if has_set { qb.push(", "); }
            qb.push("\"order\" = ");
            qb.push_bind(*ord_opt);
            has_set = true;
        }

        // 若没有任何业务字段出现，仅更新 updater_id + update_date_time
        if has_set { qb.push(", "); }
        qb.push("updater_id = ");
        qb.push_bind(updater_id);
        qb.push(", update_date_time = CURRENT_TIMESTAMP WHERE id = ");
        qb.push_bind(project_id);
        qb.push(PROJECT_RETURNING);

        let project = qb
            .build_query_as::<Project>()
            .fetch_optional(pool)
            .await?;

        Ok(project)
    }

    pub async fn delete_project(pool: &PgPool, project_id: i64) -> AppResult<bool> {
        let mut tx = pool.begin().await?;
        sqlx::query("DELETE FROM project_tasks WHERE project_id = $1")
            .bind(project_id)
            .execute(&mut *tx)
            .await?;
        sqlx::query("DELETE FROM project_task_attribute_configs WHERE project_id = $1")
            .bind(project_id)
            .execute(&mut *tx)
            .await?;
        sqlx::query("DELETE FROM project_visits WHERE project_id = $1")
            .bind(project_id)
            .execute(&mut *tx)
            .await?;
        let result = sqlx::query("DELETE FROM projects WHERE id = $1")
            .bind(project_id)
            .execute(&mut *tx)
            .await?;
        let deleted = result.rows_affected() > 0;
        tx.commit().await?;
        Ok(deleted)
    }

    pub async fn batch_delete_projects(pool: &PgPool, project_ids: Vec<i64>) -> AppResult<u64> {
        if project_ids.is_empty() {
            return Ok(0);
        }
        let mut tx = pool.begin().await?;
        sqlx::query("DELETE FROM project_tasks WHERE project_id = ANY($1)")
            .bind(&project_ids)
            .execute(&mut *tx)
            .await?;
        sqlx::query("DELETE FROM project_task_attribute_configs WHERE project_id = ANY($1)")
            .bind(&project_ids)
            .execute(&mut *tx)
            .await?;
        sqlx::query("DELETE FROM project_visits WHERE project_id = ANY($1)")
            .bind(&project_ids)
            .execute(&mut *tx)
            .await?;
        let result = sqlx::query("DELETE FROM projects WHERE id = ANY($1)")
            .bind(&project_ids)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        Ok(result.rows_affected())
    }

    pub async fn reorder_projects(pool: &PgPool, project_ids: Vec<i64>) -> AppResult<()> {
        if project_ids.is_empty() {
            return Ok(());
        }

        // 生成 order 值数组 [0.0, 1.0, 2.0, ...]
        let orders: Vec<f64> = (0..project_ids.len()).map(|i| i as f64).collect();

        sqlx::query(
            r#"
            UPDATE projects
            SET "order" = data.new_order, update_date_time = CURRENT_TIMESTAMP
            FROM unnest($1::bigint[], $2::float8[]) AS data(id, new_order)
            WHERE projects.id = data.id
            "#,
        )
        .bind(&project_ids)
        .bind(&orders)
        .execute(pool)
        .await?;

        Ok(())
    }
}

impl ProjectVisitRepository {
    /// 记录用户访问项目（UPSERT：同一用户+项目只保留一条，更新 visited_at）
    pub async fn record_visit(
        pool: &PgPool,
        visit_id: i64,
        user_id: i64,
        project_id: i64,
    ) -> AppResult<()> {
        sqlx::query(
            r#"
            INSERT INTO project_visits (id, user_id, project_id, visited_at, create_date_time)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, project_id)
            DO UPDATE SET visited_at = CURRENT_TIMESTAMP,
                         update_date_time = CURRENT_TIMESTAMP
            "#,
        )
        .bind(visit_id)
        .bind(user_id)
        .bind(project_id)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// 获取用户最近访问的项目列表（JOIN projects 表返回完整项目信息）
    pub async fn get_recently_visited_projects(
        pool: &PgPool,
        user_id: i64,
        params: RecentlyVisitedQueryParams,
    ) -> AppResult<Vec<Project>> {
        let limit = params.limit.unwrap_or(20);
        let project_name_pattern = params.project_name.as_ref().map(|p| format!("%{}%", p));

        let projects = sqlx::query_as::<_, Project>(
            r#"
            SELECT p.id, p.project_name, p.description, p.start_date_time, p.end_date_time,
                   p.project_status, p.version, p."order", p.creator_id, p.updater_id,
                   p.create_date_time, p.update_date_time
            FROM projects p
            INNER JOIN project_visits pv ON p.id = pv.project_id
            WHERE pv.user_id = $1
              AND ($2::TEXT IS NULL OR p.project_name ILIKE $2)
            ORDER BY pv.visited_at DESC
            LIMIT $3
            "#,
        )
        .bind(user_id)
        .bind(&project_name_pattern)
        .bind(limit)
        .fetch_all(pool)
        .await?;

        Ok(projects)
    }
}

use crate::common::error::AppResult;
use crate::modules::business::project::models::{
    CreateProjectParams, Project, ProjectQueryParams, UpdateProjectParams,
};
use sqlx::PgPool;
use sqlx::QueryBuilder;

pub struct ProjectRepository;

impl ProjectRepository {
    pub async fn get_project_list(
        pool: &PgPool,
        params: ProjectQueryParams,
    ) -> AppResult<(Vec<Project>, i64)> {
        let page = params.page.unwrap_or(1);
        let page_size = params.page_size.unwrap_or(10);
        let offset = (page - 1) * page_size;
        let project_name_pattern = params.project_name.as_ref().map(|p| format!("%{}%", p));
        let projects = sqlx::query_as::<_, Project>(
            r#"
            SELECT id, project_name, description, start_date_time, end_date_time,
                   project_status, version, "order", creator_id, updater_id,
                   create_date_time, update_date_time
            FROM projects
            WHERE ($1::TEXT IS NULL OR project_name ILIKE $1)
              AND ($2::SMALLINT IS NULL OR project_status = $2)
              AND ($3::TIMESTAMP IS NULL OR start_date_time >= $3)
              AND ($4::TIMESTAMP IS NULL OR end_date_time <= $4)
            ORDER BY "order" ASC NULLS LAST, create_date_time DESC
            LIMIT $5 OFFSET $6
            "#,
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
            r#"
            SELECT id, project_name, description, start_date_time, end_date_time,
                   project_status, version, "order", creator_id, updater_id,
                   create_date_time, update_date_time
            FROM projects
            WHERE ($1::TEXT IS NULL OR project_name ILIKE $1)
              AND ($2::SMALLINT IS NULL OR project_status = $2)
              AND ($3::TIMESTAMP IS NULL OR start_date_time >= $3)
              AND ($4::TIMESTAMP IS NULL OR end_date_time <= $4)
            ORDER BY "order" ASC NULLS LAST, create_date_time DESC
            "#,
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
            r#"
            SELECT id, project_name, description, start_date_time, end_date_time,
                   project_status, version, "order", creator_id, updater_id,
                   create_date_time, update_date_time
            FROM projects
            WHERE id = $1
            "#,
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
            r#"
            SELECT id, project_name, description, start_date_time, end_date_time,
                   project_status, version, "order", creator_id, updater_id,
                   create_date_time, update_date_time
            FROM projects
            WHERE project_name = $1
            "#,
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
        let page_size = params.page_size.unwrap_or(10);
        let offset = (page - 1) * page_size;
        let project_name_pattern = params.project_name.as_ref().map(|p| format!("%{}%", p));

        let projects = sqlx::query_as::<_, Project>(
            r#"
            SELECT id, project_name, description, start_date_time, end_date_time,
                   project_status, version, "order", creator_id, updater_id,
                   create_date_time, update_date_time
            FROM projects
            WHERE creator_id = $1
              AND ($2::TEXT IS NULL OR project_name ILIKE $2)
            ORDER BY "order" ASC NULLS LAST, create_date_time DESC
            LIMIT $3 OFFSET $4
            "#,
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
            r#"
            SELECT id, project_name, description, start_date_time, end_date_time,
                   project_status, version, "order", creator_id, updater_id,
                   create_date_time, update_date_time
            FROM projects
            WHERE creator_id = $1
              AND ($2::TEXT IS NULL OR project_name ILIKE $2)
            ORDER BY "order" ASC NULLS LAST, create_date_time DESC
            "#,
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
        let project = sqlx::query_as::<_, Project>(
            r#"
            INSERT INTO projects (id, project_name, description, start_date_time, end_date_time,
                                 project_status, version, "order", creator_id, create_date_time)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            RETURNING id, project_name, description, start_date_time, end_date_time,
                      project_status, version, "order", creator_id, updater_id,
                      create_date_time, update_date_time
            "#,
        )
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
        qb.push(
            " RETURNING id, project_name, description, start_date_time, end_date_time, \
             project_status, version, \"order\", creator_id, updater_id, \
             create_date_time, update_date_time",
        );

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

        let mut tx = pool.begin().await?;

        // 为每个项目设置新的 order 值，从 0 开始递增
        for (index, project_id) in project_ids.iter().enumerate() {
            sqlx::query(
                r#"
                UPDATE projects
                SET "order" = $1, update_date_time = CURRENT_TIMESTAMP
                WHERE id = $2
                "#,
            )
            .bind(index as f64)
            .bind(project_id)
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;
        Ok(())
    }
}

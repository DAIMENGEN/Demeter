use crate::common::error::AppResult;
use crate::modules::business::project::models::{
    CreateProjectParams, Project, ProjectQueryParams, UpdateProjectParams,
};
use sqlx::PgPool;

/// 项目数据访问层
pub struct ProjectRepository;

impl ProjectRepository {
    /// 获取项目列表（分页）
    pub async fn get_project_list(
        pool: &PgPool,
        params: ProjectQueryParams,
    ) -> AppResult<(Vec<Project>, i64)> {
        let page = params.page.unwrap_or(1);
        let page_size = params.page_size.unwrap_or(10);
        let offset = (page - 1) * page_size;

        let project_name_pattern = params.project_name.as_ref().map(|p| format!("%{}%", p));
        let creator_id_value = params.creator_id.map(|id| id.0);

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
              AND ($5::BIGINT IS NULL OR creator_id = $5)
            ORDER BY "order" ASC NULLS LAST, create_date_time DESC
            LIMIT $6 OFFSET $7
            "#,
        )
        .bind(&project_name_pattern)
        .bind(params.project_status)
        .bind(params.start_date_time)
        .bind(params.end_date_time)
        .bind(creator_id_value)
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
              AND ($5::BIGINT IS NULL OR creator_id = $5)
            "#,
        )
        .bind(&project_name_pattern)
        .bind(params.project_status)
        .bind(params.start_date_time)
        .bind(params.end_date_time)
        .bind(creator_id_value)
        .fetch_one(pool)
        .await?;

        Ok((projects, total.0))
    }

    /// 获取所有项目（不分页）
    pub async fn get_all_projects(
        pool: &PgPool,
        params: ProjectQueryParams,
    ) -> AppResult<Vec<Project>> {
        let project_name_pattern = params.project_name.as_ref().map(|p| format!("%{}%", p));
        let creator_id_value = params.creator_id.map(|id| id.0);

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
              AND ($5::BIGINT IS NULL OR creator_id = $5)
            ORDER BY "order" ASC NULLS LAST, create_date_time DESC
            "#,
        )
        .bind(&project_name_pattern)
        .bind(params.project_status)
        .bind(params.start_date_time)
        .bind(params.end_date_time)
        .bind(creator_id_value)
        .fetch_all(pool)
        .await?;

        Ok(projects)
    }

    /// 根据 ID 获取项目
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

    /// 根据项目名称获取项目
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

    /// 创建项目
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

    /// 更新项目
    pub async fn update_project(
        pool: &PgPool,
        project_id: i64,
        params: UpdateProjectParams,
        updater_id: i64,
    ) -> AppResult<Option<Project>> {
        let project = sqlx::query_as::<_, Project>(
            r#"
            UPDATE projects
            SET project_name = COALESCE($1, project_name),
                description = COALESCE($2, description),
                start_date_time = COALESCE($3, start_date_time),
                end_date_time = $4,
                project_status = COALESCE($5, project_status),
                version = COALESCE($6, version),
                "order" = COALESCE($7, "order"),
                updater_id = $8,
                update_date_time = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING id, project_name, description, start_date_time, end_date_time,
                      project_status, version, "order", creator_id, updater_id,
                      create_date_time, update_date_time
            "#,
        )
        .bind(&params.project_name)
        .bind(&params.description)
        .bind(params.start_date_time)
        .bind(params.end_date_time)
        .bind(params.project_status)
        .bind(params.version)
        .bind(params.order)
        .bind(updater_id)
        .bind(project_id)
        .fetch_optional(pool)
        .await?;

        Ok(project)
    }

    /// 删除项目（级联删除所有任务和任务属性配置）
    pub async fn delete_project(pool: &PgPool, project_id: i64) -> AppResult<bool> {
        let mut tx = pool.begin().await?;

        // 1. 删除该项目下的所有任务（包括子任务）
        sqlx::query("DELETE FROM project_tasks WHERE project_id = $1")
            .bind(project_id)
            .execute(&mut *tx)
            .await?;

        // 2. 删除该项目的所有任务属性配置
        sqlx::query("DELETE FROM project_task_attribute_configs WHERE project_id = $1")
            .bind(project_id)
            .execute(&mut *tx)
            .await?;

        // 3. 删除项目本身
        let result = sqlx::query("DELETE FROM projects WHERE id = $1")
            .bind(project_id)
            .execute(&mut *tx)
            .await?;

        let deleted = result.rows_affected() > 0;

        tx.commit().await?;

        Ok(deleted)
    }

    /// 批量删除项目（级联删除所有任务和任务属性配置）
    pub async fn batch_delete_projects(pool: &PgPool, project_ids: Vec<i64>) -> AppResult<u64> {
        if project_ids.is_empty() {
            return Ok(0);
        }

        let mut tx = pool.begin().await?;

        // 1. 删除这些项目下的所有任务（包括子任务）
        sqlx::query("DELETE FROM project_tasks WHERE project_id = ANY($1)")
            .bind(&project_ids)
            .execute(&mut *tx)
            .await?;

        // 2. 删除这些项目的所有任务属性配置
        sqlx::query("DELETE FROM project_task_attribute_configs WHERE project_id = ANY($1)")
            .bind(&project_ids)
            .execute(&mut *tx)
            .await?;

        // 3. 删除项目本身
        let result = sqlx::query("DELETE FROM projects WHERE id = ANY($1)")
            .bind(&project_ids)
            .execute(&mut *tx)
            .await?;

        tx.commit().await?;

        Ok(result.rows_affected())
    }
}

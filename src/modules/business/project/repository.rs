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

        // 构建查询条件
        let mut query = String::from(
            r#"SELECT id, project_name, description, start_date_time, end_date_time,
             project_status, version, "order", creator_id, updater_id,
             create_date_time, update_date_time
             FROM projects WHERE 1=1"#,
        );
        let mut count_query = String::from("SELECT COUNT(*) FROM projects WHERE 1=1");

        if let Some(project_name) = &params.project_name {
            query.push_str(&format!(" AND project_name ILIKE '%{}%'", project_name));
            count_query.push_str(&format!(" AND project_name ILIKE '%{}%'", project_name));
        }

        if let Some(project_status) = params.project_status {
            query.push_str(&format!(" AND project_status = {}", project_status));
            count_query.push_str(&format!(" AND project_status = {}", project_status));
        }

        if let Some(start_date_time) = &params.start_date_time {
            query.push_str(&format!(" AND start_date_time >= '{}'", start_date_time.format("%Y-%m-%d %H:%M:%S")));
            count_query.push_str(&format!(" AND start_date_time >= '{}'", start_date_time.format("%Y-%m-%d %H:%M:%S")));
        }

        if let Some(end_date_time) = &params.end_date_time {
            query.push_str(&format!(" AND end_date_time <= '{}'", end_date_time.format("%Y-%m-%d %H:%M:%S")));
            count_query.push_str(&format!(" AND end_date_time <= '{}'", end_date_time.format("%Y-%m-%d %H:%M:%S")));
        }

        query.push_str(&format!(
            r#" ORDER BY "order" ASC NULLS LAST, create_date_time DESC LIMIT {} OFFSET {}"#,
            page_size, offset
        ));

        let projects = sqlx::query_as::<_, Project>(&query).fetch_all(pool).await?;

        let total: (i64,) = sqlx::query_as(&count_query).fetch_one(pool).await?;

        Ok((projects, total.0))
    }

    /// 获取所有项目（不分页）
    pub async fn get_all_projects(
        pool: &PgPool,
        params: ProjectQueryParams,
    ) -> AppResult<Vec<Project>> {
        let mut query = String::from(
            r#"SELECT id, project_name, description, start_date_time, end_date_time,
             project_status, version, "order", creator_id, updater_id,
             create_date_time, update_date_time
             FROM projects WHERE 1=1"#,
        );

        if let Some(project_name) = &params.project_name {
            query.push_str(&format!(" AND project_name ILIKE '%{}%'", project_name));
        }

        if let Some(project_status) = params.project_status {
            query.push_str(&format!(" AND project_status = {}", project_status));
        }

        if let Some(start_date_time) = &params.start_date_time {
            query.push_str(&format!(" AND start_date_time >= '{}'", start_date_time.format("%Y-%m-%d %H:%M:%S")));
        }

        if let Some(end_date_time) = &params.end_date_time {
            query.push_str(&format!(" AND end_date_time <= '{}'", end_date_time.format("%Y-%m-%d %H:%M:%S")));
        }

        query.push_str(r#" ORDER BY "order" ASC NULLS LAST, create_date_time DESC"#);

        let projects = sqlx::query_as::<_, Project>(&query).fetch_all(pool).await?;

        Ok(projects)
    }

    /// 根据 ID 获取项目
    pub async fn get_project_by_id(pool: &PgPool, id: i64) -> AppResult<Option<Project>> {
        let project = sqlx::query_as::<_, Project>(
            r#"
            SELECT id, project_name, description, start_date_time, end_date_time,
                   project_status, version, "order", creator_id, updater_id,
                   create_date_time, update_date_time
            FROM projects
            WHERE id = $1
            "#,
        )
        .bind(id)
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
        params: CreateProjectParams,
        creator_id: &str,
    ) -> AppResult<Project> {
        let project = sqlx::query_as::<_, Project>(
            r#"
            INSERT INTO projects (project_name, description, start_date_time, end_date_time,
                                 project_status, version, "order", creator_id, create_date_time)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING id, project_name, description, start_date_time, end_date_time,
                      project_status, version, "order", creator_id, updater_id,
                      create_date_time, update_date_time
            "#,
        )
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
        id: i64,
        params: UpdateProjectParams,
        updater_id: &str,
    ) -> AppResult<Option<Project>> {
        // 先检查项目是否存在
        let existing = Self::get_project_by_id(pool, id).await?;
        if existing.is_none() {
            return Ok(None);
        }

        let mut query =
            String::from("UPDATE projects SET updater_id = $1, update_date_time = NOW()");
        let mut param_count = 1;

        if params.project_name.is_some() {
            param_count += 1;
            query.push_str(&format!(", project_name = ${}", param_count));
        }
        if params.description.is_some() {
            param_count += 1;
            query.push_str(&format!(", description = ${}", param_count));
        }
        if params.start_date_time.is_some() {
            param_count += 1;
            query.push_str(&format!(", start_date_time = ${}", param_count));
        }
        if params.end_date_time.is_some() {
            param_count += 1;
            query.push_str(&format!(", end_date_time = ${}", param_count));
        }
        if params.project_status.is_some() {
            param_count += 1;
            query.push_str(&format!(", project_status = ${}", param_count));
        }
        if params.version.is_some() {
            param_count += 1;
            query.push_str(&format!(", version = ${}", param_count));
        }
        if params.order.is_some() {
            param_count += 1;
            query.push_str(&format!(r#", "order" = ${}"#, param_count));
        }

        param_count += 1;
        query.push_str(&format!(" WHERE id = ${}", param_count));
        query.push_str(
            r#" RETURNING id, project_name, description, start_date_time, end_date_time,
                         project_status, version, "order", creator_id, updater_id,
                         create_date_time, update_date_time"#,
        );

        let mut query_builder = sqlx::query_as::<_, Project>(&query).bind(updater_id);

        if let Some(project_name) = params.project_name {
            query_builder = query_builder.bind(project_name);
        }
        if let Some(description) = params.description {
            query_builder = query_builder.bind(description);
        }
        if let Some(start_date_time) = params.start_date_time {
            query_builder = query_builder.bind(start_date_time);
        }
        if let Some(end_date_time) = params.end_date_time {
            query_builder = query_builder.bind(end_date_time);
        }
        if let Some(project_status) = params.project_status {
            query_builder = query_builder.bind(project_status);
        }
        if let Some(version) = params.version {
            query_builder = query_builder.bind(version);
        }
        if let Some(order) = params.order {
            query_builder = query_builder.bind(order);
        }

        query_builder = query_builder.bind(id);

        let project = query_builder.fetch_one(pool).await?;

        Ok(Some(project))
    }

    /// 删除项目
    pub async fn delete_project(pool: &PgPool, id: i64) -> AppResult<bool> {
        let result = sqlx::query("DELETE FROM projects WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    /// 批量删除项目
    pub async fn batch_delete_projects(pool: &PgPool, ids: Vec<i64>) -> AppResult<u64> {
        if ids.is_empty() {
            return Ok(0);
        }

        let placeholders: Vec<String> = (1..=ids.len()).map(|i| format!("${}", i)).collect();
        let query_str = format!(
            "DELETE FROM projects WHERE id IN ({})",
            placeholders.join(", ")
        );

        let mut query = sqlx::query(&query_str);
        for id in ids {
            query = query.bind(id);
        }

        let result = query.execute(pool).await?;

        Ok(result.rows_affected())
    }
}

use crate::common::error::AppResult;
use crate::modules::business::project::task::models::{
    CreateTaskAttributeConfigParams, CreateTaskParams, Task, TaskAttributeConfig, TaskQueryParams,
    UpdateTaskAttributeConfigParams, UpdateTaskParams,
};
use sqlx::PgPool;
use sqlx::QueryBuilder;

pub struct TaskRepository;

impl TaskRepository {
    pub async fn get_attribute_configs_by_project(
        pool: &PgPool,
        project_id: i64,
    ) -> AppResult<Vec<TaskAttributeConfig>> {
        let configs = sqlx::query_as::<_, TaskAttributeConfig>(
            r#"SELECT id, project_id, attribute_name, attribute_label, attribute_type,
                      is_required, default_value,
                      COALESCE(options, 'null'::jsonb) AS options,
                      COALESCE(value_color_map, 'null'::jsonb) AS value_color_map,
                      "order", creator_id, updater_id, create_date_time, update_date_time
               FROM project_task_attribute_configs
               WHERE project_id = $1
               ORDER BY "order" ASC NULLS LAST, create_date_time ASC"#,
        )
        .bind(project_id)
        .fetch_all(pool)
        .await?;

        Ok(configs)
    }

    pub async fn get_attribute_config_by_id(
        pool: &PgPool,
        config_id: i64,
    ) -> AppResult<Option<TaskAttributeConfig>> {
        let config = sqlx::query_as::<_, TaskAttributeConfig>(
            r#"SELECT id, project_id, attribute_name, attribute_label, attribute_type,
                      is_required, default_value,
                      COALESCE(options, 'null'::jsonb) AS options,
                      COALESCE(value_color_map, 'null'::jsonb) AS value_color_map,
                      "order", creator_id, updater_id, create_date_time, update_date_time
               FROM project_task_attribute_configs
               WHERE id = $1"#,
        )
        .bind(config_id)
        .fetch_optional(pool)
        .await?;

        Ok(config)
    }

    pub async fn create_attribute_config(
        pool: &PgPool,
        id: i64,
        project_id: i64,
        params: CreateTaskAttributeConfigParams,
        creator_id: i64,
    ) -> AppResult<TaskAttributeConfig> {
        let config = sqlx::query_as::<_, TaskAttributeConfig>(
            r#"INSERT INTO project_task_attribute_configs
               (id, project_id, attribute_name, attribute_label, attribute_type,
                is_required, default_value, options, value_color_map, "order", creator_id, create_date_time)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
               RETURNING id, project_id, attribute_name, attribute_label, attribute_type,
                         is_required, default_value,
                         COALESCE(options, 'null'::jsonb) AS options,
                         COALESCE(value_color_map, 'null'::jsonb) AS value_color_map,
                         "order", creator_id, updater_id, create_date_time, update_date_time"#
        )
        .bind(id)
        .bind(project_id)
        .bind(&params.attribute_name)
        .bind(&params.attribute_label)
        .bind(&params.attribute_type)
        .bind(params.is_required)
        .bind(&params.default_value)
        .bind(&params.options)
        .bind(&params.value_color_map)
        .bind(params.order)
        .bind(creator_id)
        .fetch_one(pool)
        .await?;

        Ok(config)
    }

    pub async fn update_attribute_config(
        pool: &PgPool,
        config_id: i64,
        params: UpdateTaskAttributeConfigParams,
        updater_id: i64,
    ) -> AppResult<TaskAttributeConfig> {
        // 动态构建 SET 子句
        let mut qb: QueryBuilder<sqlx::Postgres> =
            QueryBuilder::new("UPDATE project_task_attribute_configs SET ");
        let mut has_set = false;

        // NOT NULL 字段
        if let Some(ref label) = params.attribute_label {
            qb.push("attribute_label = ");
            qb.push_bind(label.clone());
            has_set = true;
        }

        if let Some(ref required) = params.is_required {
            if has_set { qb.push(", "); }
            qb.push("is_required = ");
            qb.push_bind(*required);
            has_set = true;
        }

        // 可空字段：双层 Option
        if let Some(ref dv_opt) = params.default_value {
            if has_set { qb.push(", "); }
            qb.push("default_value = ");
            qb.push_bind(dv_opt.clone());
            has_set = true;
        }

        if let Some(ref opts_opt) = params.options {
            if has_set { qb.push(", "); }
            qb.push("options = ");
            qb.push_bind(opts_opt.clone());
            has_set = true;
        }

        if let Some(ref vcm_opt) = params.value_color_map {
            if has_set { qb.push(", "); }
            qb.push("value_color_map = ");
            qb.push_bind(vcm_opt.clone());
            has_set = true;
        }

        if let Some(ref ord_opt) = params.order {
            if has_set { qb.push(", "); }
            qb.push("\"order\" = ");
            qb.push_bind(*ord_opt);
            has_set = true;
        }

        if has_set { qb.push(", "); }
        qb.push("updater_id = ");
        qb.push_bind(updater_id);
        qb.push(", update_date_time = CURRENT_TIMESTAMP WHERE id = ");
        qb.push_bind(config_id);
        qb.push(
            " RETURNING id, project_id, attribute_name, attribute_label, attribute_type, \
             is_required, default_value, \
             COALESCE(options, 'null'::jsonb) AS options, \
             COALESCE(value_color_map, 'null'::jsonb) AS value_color_map, \
             \"order\", creator_id, updater_id, create_date_time, update_date_time",
        );

        let config = qb
            .build_query_as::<TaskAttributeConfig>()
            .fetch_one(pool)
            .await?;

        Ok(config)
    }

    pub async fn delete_attribute_config(pool: &PgPool, config_id: i64) -> AppResult<()> {
        sqlx::query("DELETE FROM project_task_attribute_configs WHERE id = $1")
            .bind(config_id)
            .execute(pool)
            .await?;

        Ok(())
    }

    pub async fn batch_delete_attribute_configs(pool: &PgPool, ids: Vec<i64>) -> AppResult<()> {
        sqlx::query("DELETE FROM project_task_attribute_configs WHERE id = ANY($1)")
            .bind(&ids)
            .execute(pool)
            .await?;

        Ok(())
    }

    pub async fn get_task_list(
        pool: &PgPool,
        project_id: i64,
        params: TaskQueryParams,
    ) -> AppResult<(Vec<Task>, i64)> {
        let page = params.page.unwrap_or(1);
        let page_size = params.page_size.unwrap_or(10);
        let offset = (page - 1) * page_size;
        let task_name_pattern = params.task_name.as_ref().map(|t| format!("%{}%", t));
        let tasks = sqlx::query_as::<_, Task>(
            r#"SELECT id, task_name, parent_id, project_id, "order",
                      custom_attributes,
                      start_date_time, end_date_time, task_type,
                      creator_id, updater_id, create_date_time, update_date_time
               FROM project_tasks
               WHERE project_id = $1
                 AND ($2::TEXT IS NULL OR task_name ILIKE $2)
                 AND ($3::BIGINT IS NULL OR parent_id = $3)
               ORDER BY "order" ASC NULLS LAST, create_date_time DESC
               LIMIT $4 OFFSET $5"#,
        )
        .bind(project_id)
        .bind(&task_name_pattern)
        .bind(params.parent_id)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        let total: (i64,) = sqlx::query_as(
            r#"SELECT COUNT(*)
               FROM project_tasks
               WHERE project_id = $1
                 AND ($2::TEXT IS NULL OR task_name ILIKE $2)
                 AND ($3::BIGINT IS NULL OR parent_id = $3)"#,
        )
        .bind(project_id)
        .bind(&task_name_pattern)
        .bind(params.parent_id)
        .fetch_one(pool)
        .await?;

        Ok((tasks, total.0))
    }

    pub async fn get_all_tasks(
        pool: &PgPool,
        project_id: i64,
        params: TaskQueryParams,
    ) -> AppResult<Vec<Task>> {
        let task_name_pattern = params.task_name.as_ref().map(|t| format!("%{}%", t));
        let tasks = sqlx::query_as::<_, Task>(
            r#"SELECT id, task_name, parent_id, project_id, "order",
                      custom_attributes,
                      start_date_time, end_date_time, task_type,
                      creator_id, updater_id, create_date_time, update_date_time
               FROM project_tasks
               WHERE project_id = $1
                 AND ($2::TEXT IS NULL OR task_name ILIKE $2)
                 AND ($3::BIGINT IS NULL OR parent_id = $3)
               ORDER BY "order" ASC NULLS LAST, create_date_time DESC"#,
        )
        .bind(project_id)
        .bind(&task_name_pattern)
        .bind(params.parent_id)
        .fetch_all(pool)
        .await?;

        Ok(tasks)
    }

    pub async fn get_task_by_id(pool: &PgPool, task_id: i64) -> AppResult<Option<Task>> {
        let task = sqlx::query_as::<_, Task>(
            r#"SELECT id, task_name, parent_id, project_id, "order",
                      custom_attributes,
                      start_date_time, end_date_time, task_type,
                      creator_id, updater_id, create_date_time, update_date_time
               FROM project_tasks
               WHERE id = $1"#,
        )
        .bind(task_id)
        .fetch_optional(pool)
        .await?;

        Ok(task)
    }

    pub async fn create_task(
        pool: &PgPool,
        id: i64,
        project_id: i64,
        params: CreateTaskParams,
        creator_id: i64,
    ) -> AppResult<Task> {
        let custom_attrs = params.custom_attributes.unwrap_or(serde_json::json!({}));
        let task = sqlx::query_as::<_, Task>(
            r#"INSERT INTO project_tasks
               (id, task_name, parent_id, project_id, "order", custom_attributes,
                start_date_time, end_date_time, task_type,
                creator_id, create_date_time)
               VALUES ($1, $2, $3, $4, $5, $6,
                       $7, $8, $9,
                       $10, CURRENT_TIMESTAMP)
               RETURNING id, task_name, parent_id, project_id, "order",
                         custom_attributes,
                         start_date_time, end_date_time, task_type,
                         creator_id, updater_id, create_date_time, update_date_time"#,
        )
        .bind(id)
        .bind(&params.task_name)
        .bind(params.parent_id)
        .bind(project_id)
        .bind(params.order)
        .bind(&custom_attrs)
        .bind(params.start_date_time)
        .bind(params.end_date_time)
        .bind(params.task_type)
        .bind(creator_id)
        .fetch_one(pool)
        .await?;

        Ok(task)
    }

    pub async fn update_task(
        pool: &PgPool,
        task_id: i64,
        params: UpdateTaskParams,
        updater_id: i64,
    ) -> AppResult<Task> {
        // 动态构建 SET 子句
        let mut qb: QueryBuilder<sqlx::Postgres> =
            QueryBuilder::new("UPDATE project_tasks SET ");
        let mut has_set = false;

        // NOT NULL 字段
        if let Some(ref name) = params.task_name {
            qb.push("task_name = ");
            qb.push_bind(name.clone());
            has_set = true;
        }

        // 可空字段：双层 Option
        if let Some(ref pid_opt) = params.parent_id {
            if has_set { qb.push(", "); }
            qb.push("parent_id = ");
            qb.push_bind(pid_opt.map(|id| id.0));
            has_set = true;
        }

        // NOT NULL 字段
        if let Some(ref ord) = params.order {
            if has_set { qb.push(", "); }
            qb.push("\"order\" = ");
            qb.push_bind(*ord);
            has_set = true;
        }

        if let Some(ref sdt) = params.start_date_time {
            if has_set { qb.push(", "); }
            qb.push("start_date_time = ");
            qb.push_bind(*sdt);
            has_set = true;
        }

        if let Some(ref edt) = params.end_date_time {
            if has_set { qb.push(", "); }
            qb.push("end_date_time = ");
            qb.push_bind(*edt);
            has_set = true;
        }

        if let Some(ref tt) = params.task_type {
            if has_set { qb.push(", "); }
            qb.push("task_type = ");
            qb.push_bind(*tt);
            has_set = true;
        }

        if let Some(ref ca) = params.custom_attributes {
            if has_set { qb.push(", "); }
            qb.push("custom_attributes = ");
            qb.push_bind(ca.clone());
            has_set = true;
        }

        if has_set { qb.push(", "); }
        qb.push("updater_id = ");
        qb.push_bind(updater_id);
        qb.push(", update_date_time = CURRENT_TIMESTAMP WHERE id = ");
        qb.push_bind(task_id);
        qb.push(
            " RETURNING id, task_name, parent_id, project_id, \"order\", \
             custom_attributes, \
             start_date_time, end_date_time, task_type, \
             creator_id, updater_id, create_date_time, update_date_time",
        );

        let task = qb
            .build_query_as::<Task>()
            .fetch_one(pool)
            .await?;

        Ok(task)
    }

    pub async fn delete_task(pool: &PgPool, task_id: i64) -> AppResult<()> {
        sqlx::query(
            r#"
            WITH RECURSIVE subtree AS (
                SELECT id, project_id
                FROM project_tasks
                WHERE id = $1
                UNION ALL
                SELECT t.id, t.project_id
                FROM project_tasks t
                INNER JOIN subtree s ON t.parent_id = s.id
                WHERE t.project_id = s.project_id
            )
            DELETE FROM project_tasks
            WHERE id IN (SELECT id FROM subtree)
            "#,
        )
        .bind(task_id)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn batch_delete_tasks(pool: &PgPool, task_ids: Vec<i64>) -> AppResult<()> {
        if task_ids.is_empty() {
            return Ok(());
        }
        sqlx::query(
            r#"
            WITH RECURSIVE roots AS (
                SELECT id, project_id
                FROM project_tasks
                WHERE id = ANY($1)
            ),
            subtree AS (
                SELECT id, project_id
                FROM roots
                UNION ALL
                SELECT t.id, t.project_id
                FROM project_tasks t
                INNER JOIN subtree s ON t.parent_id = s.id
                WHERE t.project_id = s.project_id
            )
            DELETE FROM project_tasks
            WHERE id IN (SELECT DISTINCT id FROM subtree)
            "#,
        )
        .bind(&task_ids)
        .execute(pool)
        .await?;

        Ok(())
    }
}

use crate::common::error::AppResult;
use crate::modules::business::project::task::models::{
    CreateTaskAttributeConfigParams, CreateTaskParams, Task, TaskAttributeConfig,
    TaskQueryParams, UpdateTaskAttributeConfigParams, UpdateTaskParams,
};
use sqlx::PgPool;

/// 任务数据访问层
pub struct TaskRepository;

impl TaskRepository {
    // ==================== 任务属性配置相关 ====================

    /// 获取项目的所有任务属性配置
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
               ORDER BY "order" ASC NULLS LAST, create_date_time ASC"#
        )
        .bind(project_id)
        .fetch_all(pool)
        .await?;

        Ok(configs)
    }

    /// 根据ID获取任务属性配置
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
               WHERE id = $1"#
        )
        .bind(config_id)
        .fetch_optional(pool)
        .await?;

        Ok(config)
    }

    /// 创建任务属性配置
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

    /// 更新任务属性配置
    pub async fn update_attribute_config(
        pool: &PgPool,
        config_id: i64,
        params: UpdateTaskAttributeConfigParams,
        updater_id: i64,
    ) -> AppResult<TaskAttributeConfig> {
        let config = sqlx::query_as::<_, TaskAttributeConfig>(
            r#"UPDATE project_task_attribute_configs
               SET attribute_label = COALESCE($1, attribute_label),
                   is_required = COALESCE($2, is_required),
                   default_value = COALESCE($3, default_value),
                   options = COALESCE($4, options),
                   value_color_map = COALESCE($5, value_color_map),
                   "order" = COALESCE($6, "order"),
                   updater_id = $7,
                   update_date_time = CURRENT_TIMESTAMP
               WHERE id = $8
               RETURNING id, project_id, attribute_name, attribute_label, attribute_type,
                         is_required, default_value,
                         COALESCE(options, 'null'::jsonb) AS options,
                         COALESCE(value_color_map, 'null'::jsonb) AS value_color_map,
                         "order", creator_id, updater_id, create_date_time, update_date_time"#
        )
        .bind(&params.attribute_label)
        .bind(params.is_required)
        .bind(&params.default_value)
        .bind(&params.options)
        .bind(&params.value_color_map)
        .bind(params.order)
        .bind(updater_id)
        .bind(config_id)
        .fetch_one(pool)
        .await?;

        Ok(config)
    }

    /// 删除任务属性配置
    pub async fn delete_attribute_config(pool: &PgPool, config_id: i64) -> AppResult<()> {
        sqlx::query("DELETE FROM project_task_attribute_configs WHERE id = $1")
            .bind(config_id)
            .execute(pool)
            .await?;

        Ok(())
    }

    /// 批量删除任务属性配置
    pub async fn batch_delete_attribute_configs(
        pool: &PgPool,
        ids: Vec<i64>,
    ) -> AppResult<()> {
        sqlx::query("DELETE FROM project_task_attribute_configs WHERE id = ANY($1)")
            .bind(&ids)
            .execute(pool)
            .await?;

        Ok(())
    }

    // ==================== 任务相关 ====================

    /// 获取任务列表（分页）
    pub async fn get_task_list(
        pool: &PgPool,
        project_id: i64,
        params: TaskQueryParams,
    ) -> AppResult<(Vec<Task>, i64)> {
        let page = params.page.unwrap_or(1);
        let page_size = params.page_size.unwrap_or(10);
        let offset = (page - 1) * page_size;

        let mut conditions = vec!["project_id = $1".to_string()];
        let mut param_count = 1;

        if params.task_name.is_some() {
            param_count += 1;
            conditions.push(format!("task_name ILIKE '%' || ${} || '%'", param_count));
        }

        if params.parent_id.is_some() {
            param_count += 1;
            conditions.push(format!("parent_id = ${}", param_count));
        }

        let where_clause = if conditions.is_empty() {
            String::new()
        } else {
            format!("WHERE {}", conditions.join(" AND "))
        };

        let query = format!(
            r#"SELECT id, task_name, parent_id, project_id, "order",
                      custom_attributes,
                      start_date_time, end_date_time, task_type,
                      creator_id, updater_id, create_date_time, update_date_time
               FROM project_tasks
               {}
               ORDER BY "order" ASC NULLS LAST, create_date_time DESC
               LIMIT {} OFFSET {}"#,
            where_clause, page_size, offset
        );

        let count_query = format!(
            "SELECT COUNT(*) as count FROM project_tasks {}",
            where_clause
        );

        let mut query_builder = sqlx::query_as::<_, Task>(&query).bind(project_id);
        let mut count_query_builder = sqlx::query_scalar::<_, i64>(&count_query).bind(project_id);

        if let Some(task_name) = &params.task_name {
            query_builder = query_builder.bind(task_name);
            count_query_builder = count_query_builder.bind(task_name);
        }

        if let Some(parent_id) = params.parent_id {
            query_builder = query_builder.bind(parent_id);
            count_query_builder = count_query_builder.bind(parent_id);
        }

        let tasks = query_builder.fetch_all(pool).await?;
        let total = count_query_builder.fetch_one(pool).await?;

        Ok((tasks, total))
    }

    /// 获取所有任务（不分页）
    pub async fn get_all_tasks(
        pool: &PgPool,
        project_id: i64,
        params: TaskQueryParams,
    ) -> AppResult<Vec<Task>> {
        let mut conditions = vec!["project_id = $1".to_string()];
        let mut param_count = 1;

        if params.task_name.is_some() {
            param_count += 1;
            conditions.push(format!("task_name ILIKE '%' || ${} || '%'", param_count));
        }

        if params.parent_id.is_some() {
            param_count += 1;
            conditions.push(format!("parent_id = ${}", param_count));
        }

        let where_clause = if conditions.is_empty() {
            String::new()
        } else {
            format!("WHERE {}", conditions.join(" AND "))
        };

        let query = format!(
            r#"SELECT id, task_name, parent_id, project_id, "order",
                      custom_attributes,
                      start_date_time, end_date_time, task_type,
                      creator_id, updater_id, create_date_time, update_date_time
               FROM project_tasks
               {}
               ORDER BY "order" ASC NULLS LAST, create_date_time DESC"#,
            where_clause
        );

        let mut query_builder = sqlx::query_as::<_, Task>(&query).bind(project_id);

        if let Some(task_name) = &params.task_name {
            query_builder = query_builder.bind(task_name);
        }

        if let Some(parent_id) = params.parent_id {
            query_builder = query_builder.bind(parent_id);
        }

        let tasks = query_builder.fetch_all(pool).await?;

        Ok(tasks)
    }

    /// 根据ID获取任务
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

    /// 创建任务
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

    /// 更新任务
    pub async fn update_task(
        pool: &PgPool,
        task_id: i64,
        params: UpdateTaskParams,
        updater_id: i64,
    ) -> AppResult<Task> {
        let task = sqlx::query_as::<_, Task>(
            r#"UPDATE project_tasks
               SET task_name = COALESCE($1, task_name),
                   parent_id = COALESCE($2, parent_id),
                   "order" = COALESCE($3, "order"),
                   start_date_time = COALESCE($4, start_date_time),
                   end_date_time = COALESCE($5, end_date_time),
                   task_type = COALESCE($6, task_type),
                   custom_attributes = COALESCE($7, custom_attributes),
                   updater_id = $8,
                   update_date_time = CURRENT_TIMESTAMP
               WHERE id = $9
               RETURNING id, task_name, parent_id, project_id, "order",
                         custom_attributes,
                         start_date_time, end_date_time, task_type,
                         creator_id, updater_id, create_date_time, update_date_time"#,
        )
        .bind(&params.task_name)
        .bind(params.parent_id)
        .bind(params.order)
        .bind(params.start_date_time)
        .bind(params.end_date_time)
        .bind(params.task_type)
        .bind(&params.custom_attributes)
        .bind(updater_id)
        .bind(task_id)
        .fetch_one(pool)
        .await?;

        Ok(task)
    }

    /// 删除任务
    pub async fn delete_task(pool: &PgPool, task_id: i64) -> AppResult<()> {
        sqlx::query("DELETE FROM project_tasks WHERE id = $1")
            .bind(task_id)
            .execute(pool)
            .await?;

        Ok(())
    }

    /// 批量删除任务
    pub async fn batch_delete_tasks(pool: &PgPool, task_ids: Vec<i64>) -> AppResult<()> {
        sqlx::query("DELETE FROM project_tasks WHERE id = ANY($1)")
            .bind(&task_ids)
            .execute(pool)
            .await?;

        Ok(())
    }

    /// 将指定 project + parent_id 下的 tasks 的 order 归一为 1..N（整数，存为 f64）
    pub async fn reorder_tasks(
        pool: &PgPool,
        project_id: i64,
        parent_id: Option<i64>,
        updater_id: i64,
    ) -> AppResult<()> {
        let mut tx = pool.begin().await?;

        // 按当前 order + create_date_time 的稳定顺序取出同级 tasks
        let task_ids: Vec<i64> = if let Some(pid) = parent_id {
            sqlx::query_scalar(
                r#"SELECT id
                   FROM project_tasks
                   WHERE project_id = $1 AND parent_id = $2
                   ORDER BY "order" ASC NULLS LAST, create_date_time ASC"#,
            )
            .bind(project_id)
            .bind(pid)
            .fetch_all(&mut *tx)
            .await?
        } else {
            sqlx::query_scalar(
                r#"SELECT id
                   FROM project_tasks
                   WHERE project_id = $1 AND parent_id IS NULL
                   ORDER BY "order" ASC NULLS LAST, create_date_time ASC"#,
            )
            .bind(project_id)
            .fetch_all(&mut *tx)
            .await?
        };

        for (idx, task_id) in task_ids.into_iter().enumerate() {
            let new_order = (idx as f64) + 1.0;
            sqlx::query(
                r#"UPDATE project_tasks
                   SET "order" = $1,
                       updater_id = $2,
                       update_date_time = CURRENT_TIMESTAMP
                   WHERE id = $3"#,
            )
            .bind(new_order)
            .bind(updater_id)
            .bind(task_id)
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;
        Ok(())
    }
}

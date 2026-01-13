use crate::common::error::{AppError, AppResult};
use crate::common::jwt::Claims;
use crate::common::response::{ApiResponse, PageResponse};
use crate::modules::business::project::task::models::{
    BatchDeleteTaskAttributeConfigsParams, BatchDeleteTasksParams,
    CreateTaskAttributeConfigParams, CreateTaskParams, Task, TaskAttributeConfig,
    TaskQueryParams, UpdateTaskAttributeConfigParams, UpdateTaskParams,
};
use crate::modules::business::project::task::repository::TaskRepository;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension, Json,
};
use sqlx::PgPool;

// ==================== 任务属性配置相关 ====================

/// 获取项目的所有任务属性配置
pub async fn get_attribute_configs(
    State(pool): State<PgPool>,
    Path(project_id): Path<i64>,
) -> AppResult<Json<ApiResponse<Vec<TaskAttributeConfig>>>> {
    let configs = TaskRepository::get_attribute_configs_by_project(&pool, project_id).await?;
    Ok(Json(ApiResponse::success(configs)))
}

/// 根据ID获取任务属性配置
pub async fn get_attribute_config_by_id(
    State(pool): State<PgPool>,
    Path((_project_id, config_id)): Path<(i64, i64)>,
) -> AppResult<Json<ApiResponse<TaskAttributeConfig>>> {
    let config = TaskRepository::get_attribute_config_by_id(&pool, config_id)
        .await?
        .ok_or(AppError::NotFound(format!(
            "任务属性配置不存在: {}",
            config_id
        )))?;

    Ok(Json(ApiResponse::success(config)))
}

/// 创建任务属性配置
pub async fn create_attribute_config(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<i64>,
    Json(params): Json<CreateTaskAttributeConfigParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<TaskAttributeConfig>>)> {
    let creator_id = &claims.sub;

    let config =
        TaskRepository::create_attribute_config(&pool, project_id, params, creator_id).await?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(config))))
}

/// 更新任务属性配置
pub async fn update_attribute_config(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
    Path((_project_id, config_id)): Path<(i64, i64)>,
    Json(params): Json<UpdateTaskAttributeConfigParams>,
) -> AppResult<Json<ApiResponse<TaskAttributeConfig>>> {
    let updater_id = &claims.sub;

    let config =
        TaskRepository::update_attribute_config(&pool, config_id, params, updater_id).await?;

    Ok(Json(ApiResponse::success(config)))
}

/// 删除任务属性配置
pub async fn delete_attribute_config(
    State(pool): State<PgPool>,
    Path((_project_id, config_id)): Path<(i64, i64)>,
) -> AppResult<StatusCode> {
    TaskRepository::delete_attribute_config(&pool, config_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

/// 批量删除任务属性配置
pub async fn batch_delete_attribute_configs(
    State(pool): State<PgPool>,
    Path(_project_id): Path<i64>,
    Json(params): Json<BatchDeleteTaskAttributeConfigsParams>,
) -> AppResult<StatusCode> {
    TaskRepository::batch_delete_attribute_configs(&pool, params.ids).await?;
    Ok(StatusCode::NO_CONTENT)
}

// ==================== 任务相关 ====================

/// 获取任务列表（分页）
pub async fn get_task_list(
    State(pool): State<PgPool>,
    Path(project_id): Path<i64>,
    Query(params): Query<TaskQueryParams>,
) -> AppResult<Json<ApiResponse<PageResponse<Task>>>> {
    let (tasks, total) = TaskRepository::get_task_list(&pool, project_id, params).await?;

    Ok(Json(ApiResponse::success(PageResponse {
        list: tasks,
        total,
    })))
}

/// 获取所有任务（不分页）
pub async fn get_all_tasks(
    State(pool): State<PgPool>,
    Path(project_id): Path<i64>,
    Query(params): Query<TaskQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<Task>>>> {
    let tasks = TaskRepository::get_all_tasks(&pool, project_id, params).await?;
    Ok(Json(ApiResponse::success(tasks)))
}

/// 根据ID获取任务
pub async fn get_task_by_id(
    State(pool): State<PgPool>,
    Path((_project_id, task_id)): Path<(i64, i64)>,
) -> AppResult<Json<ApiResponse<Task>>> {
    let task = TaskRepository::get_task_by_id(&pool, task_id)
        .await?
        .ok_or(AppError::NotFound(format!("任务不存在: {}", task_id)))?;

    Ok(Json(ApiResponse::success(task)))
}

/// 创建任务
pub async fn create_task(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<i64>,
    Json(params): Json<CreateTaskParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<Task>>)> {
    let creator_id = &claims.sub;

    let task = TaskRepository::create_task(&pool, project_id, params, creator_id).await?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(task))))
}

/// 更新任务
pub async fn update_task(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
    Path((_project_id, task_id)): Path<(i64, i64)>,
    Json(params): Json<UpdateTaskParams>,
) -> AppResult<Json<ApiResponse<Task>>> {
    let updater_id = &claims.sub;

    let task = TaskRepository::update_task(&pool, task_id, params, updater_id).await?;

    Ok(Json(ApiResponse::success(task)))
}

/// 删除任务
pub async fn delete_task(
    State(pool): State<PgPool>,
    Path((_project_id, task_id)): Path<(i64, i64)>,
) -> AppResult<StatusCode> {
    TaskRepository::delete_task(&pool, task_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

/// 批量删除任务
pub async fn batch_delete_tasks(
    State(pool): State<PgPool>,
    Path(_project_id): Path<i64>,
    Json(params): Json<BatchDeleteTasksParams>,
) -> AppResult<StatusCode> {
    TaskRepository::batch_delete_tasks(&pool, params.ids).await?;
    Ok(StatusCode::NO_CONTENT)
}


use crate::common::app_state::AppState;
use crate::common::error::{AppError, AppResult};
use crate::common::id::Id;
use crate::common::jwt::Claims;
use crate::common::response::{ApiResponse, PaginatedResponse};
use crate::modules::business::project::task::models::{
    BatchCreateTasksParams, BatchDeleteTaskAttributeConfigsParams, BatchDeleteTasksParams,
    CreateTaskAttributeConfigParams, CreateTaskParams, Task, TaskAttributeConfig, TaskQueryParams,
    UpdateTaskAttributeConfigParams, UpdateTaskParams,
};
use crate::modules::business::project::task::repository::TaskRepository;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension, Json,
};

pub async fn get_attribute_configs(
    State(state): State<AppState>,
    Path(project_id): Path<Id>,
) -> AppResult<Json<ApiResponse<Vec<TaskAttributeConfig>>>> {
    let configs =
        TaskRepository::get_attribute_configs_by_project(&state.pool, project_id.0).await?;
    Ok(Json(ApiResponse::success(configs)))
}

pub async fn get_attribute_config_by_id(
    State(state): State<AppState>,
    Path((_project_id, config_id)): Path<(Id, Id)>,
) -> AppResult<Json<ApiResponse<TaskAttributeConfig>>> {
    let config = TaskRepository::get_attribute_config_by_id(&state.pool, config_id.0)
        .await?
        .ok_or(AppError::NotFound(format!(
            "Task attribute config not found: {}",
            config_id
        )))?;

    Ok(Json(ApiResponse::success(config)))
}

pub async fn create_attribute_config(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<Id>,
    Json(params): Json<CreateTaskAttributeConfigParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<TaskAttributeConfig>>)> {
    let creator_id = claims.sub;
    let config_id = state.generate_id().map_err(|e| {
        AppError::InternalError(format!(
            "Failed to generate task attribute config ID: {}",
            e
        ))
    })?;

    let config = TaskRepository::create_attribute_config(
        &state.pool,
        config_id,
        project_id.0,
        params,
        creator_id,
    )
    .await?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(config))))
}

pub async fn update_attribute_config(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path((_project_id, config_id)): Path<(Id, Id)>,
    Json(params): Json<UpdateTaskAttributeConfigParams>,
) -> AppResult<Json<ApiResponse<TaskAttributeConfig>>> {
    let updater_id = claims.sub;

    let config =
        TaskRepository::update_attribute_config(&state.pool, config_id.0, params, updater_id)
            .await?;

    Ok(Json(ApiResponse::success(config)))
}

pub async fn delete_attribute_config(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path((_project_id, config_id)): Path<(Id, Id)>,
) -> AppResult<StatusCode> {
    let updater_id = claims.sub;
    TaskRepository::archive_attribute_config(&state.pool, config_id.0, updater_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn batch_delete_attribute_configs(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(_project_id): Path<Id>,
    Json(params): Json<BatchDeleteTaskAttributeConfigsParams>,
) -> AppResult<StatusCode> {
    let updater_id = claims.sub;
    let ids: Vec<i64> = params.ids.into_iter().map(|id| id.0).collect();
    TaskRepository::batch_archive_attribute_configs(&state.pool, ids, updater_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn restore_attribute_config(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path((_project_id, config_id)): Path<(Id, Id)>,
) -> AppResult<StatusCode> {
    let updater_id = claims.sub;
    TaskRepository::restore_attribute_config(&state.pool, config_id.0, updater_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn hard_delete_attribute_config(
    State(state): State<AppState>,
    Path((_project_id, config_id)): Path<(Id, Id)>,
) -> AppResult<StatusCode> {
    TaskRepository::delete_attribute_config(&state.pool, config_id.0).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn batch_hard_delete_attribute_configs(
    State(state): State<AppState>,
    Path(_project_id): Path<Id>,
    Json(params): Json<BatchDeleteTaskAttributeConfigsParams>,
) -> AppResult<StatusCode> {
    let ids: Vec<i64> = params.ids.into_iter().map(|id| id.0).collect();
    TaskRepository::batch_delete_attribute_configs(&state.pool, ids).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_task_list(
    State(state): State<AppState>,
    Path(project_id): Path<Id>,
    Query(params): Query<TaskQueryParams>,
) -> AppResult<Json<PaginatedResponse<Task>>> {
    let page = params.page.unwrap_or(1);
    let per_page = params.per_page.unwrap_or(20);
    let (tasks, total) = TaskRepository::get_task_list(&state.pool, project_id.0, params).await?;

    Ok(Json(PaginatedResponse::new(
        tasks,
        total,
        page,
        per_page,
        &format!("/api/v1/projects/{}/tasks", project_id),
    )))
}

pub async fn get_all_tasks(
    State(state): State<AppState>,
    Path(project_id): Path<Id>,
    Query(params): Query<TaskQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<Task>>>> {
    let tasks = TaskRepository::get_all_tasks(&state.pool, project_id.0, params).await?;
    Ok(Json(ApiResponse::success(tasks)))
}

pub async fn get_task_by_id(
    State(state): State<AppState>,
    Path((_project_id, task_id)): Path<(Id, Id)>,
) -> AppResult<Json<ApiResponse<Task>>> {
    let task = TaskRepository::get_task_by_id(&state.pool, task_id.0)
        .await?
        .ok_or_else(|| AppError::NotFound("Task not found".to_string()))?;

    Ok(Json(ApiResponse::success(task)))
}

pub async fn create_task(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<Id>,
    Json(params): Json<CreateTaskParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<Task>>)> {
    let creator_id = claims.sub;
    let task_id = state
        .generate_id()
        .map_err(|e| AppError::InternalError(format!("Failed to generate task ID: {}", e)))?;

    let task =
        TaskRepository::create_task(&state.pool, task_id, project_id.0, params, creator_id).await?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(task))))
}

pub async fn batch_create_tasks(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<Id>,
    Json(params): Json<BatchCreateTasksParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<Vec<Task>>>)> {
    let creator_id = claims.sub;

    if params.tasks.is_empty() {
        return Err(AppError::BadRequest(
            "Tasks list cannot be empty".to_string(),
        ));
    }

    let mut tasks_with_ids = Vec::with_capacity(params.tasks.len());
    for task_param in params.tasks {
        let task_id = state
            .generate_id()
            .map_err(|e| AppError::InternalError(format!("Failed to generate task ID: {}", e)))?;
        tasks_with_ids.push((task_id, task_param));
    }

    let tasks = TaskRepository::batch_create_tasks(
        &state.pool,
        tasks_with_ids,
        project_id.0,
        creator_id,
    )
    .await?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(tasks))))
}

pub async fn update_task(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path((_project_id, task_id)): Path<(Id, Id)>,
    Json(params): Json<UpdateTaskParams>,
) -> AppResult<Json<ApiResponse<Task>>> {
    let updater_id = claims.sub;

    let task = TaskRepository::update_task(&state.pool, task_id.0, params, updater_id).await?;

    Ok(Json(ApiResponse::success(task)))
}

pub async fn delete_task(
    State(state): State<AppState>,
    Path((_project_id, task_id)): Path<(Id, Id)>,
) -> AppResult<StatusCode> {
    TaskRepository::delete_task(&state.pool, task_id.0).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn batch_delete_tasks(
    State(state): State<AppState>,
    Path(_project_id): Path<Id>,
    Json(params): Json<BatchDeleteTasksParams>,
) -> AppResult<StatusCode> {
    let ids: Vec<i64> = params.ids.into_iter().map(|id| id.0).collect();
    TaskRepository::batch_delete_tasks(&state.pool, ids).await?;
    Ok(StatusCode::NO_CONTENT)
}

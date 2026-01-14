use crate::common::app_state::AppState;
use crate::common::error::{AppError, AppResult};
use crate::common::jwt::Claims;
use crate::common::response::{ApiResponse, PageResponse};
use crate::common::id::Id;
use crate::modules::business::project::models::{
    BatchDeleteProjectsParams, CreateProjectParams, Project, ProjectQueryParams,
    UpdateProjectParams,
};
use crate::modules::business::project::repository::ProjectRepository;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension, Json,
};

/// 获取项目列表（分页）
pub async fn get_project_list(
    State(state): State<AppState>,
    Query(params): Query<ProjectQueryParams>,
) -> AppResult<Json<ApiResponse<PageResponse<Project>>>> {
    let (projects, total) = ProjectRepository::get_project_list(&state.pool, params).await?;

    Ok(Json(ApiResponse::success(PageResponse {
        list: projects,
        total,
    })))
}

/// 获取当前用户创建的项目列表（分页）
pub async fn get_my_project_list(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(mut params): Query<ProjectQueryParams>,
) -> AppResult<Json<ApiResponse<PageResponse<Project>>>> {
    params.creator_id = Some(Id(claims.sub));

    let (projects, total) = ProjectRepository::get_project_list(&state.pool, params).await?;

    Ok(Json(ApiResponse::success(PageResponse {
        list: projects,
        total,
    })))
}

/// 获取所有项目（不分页）
pub async fn get_all_projects(
    State(state): State<AppState>,
    Query(params): Query<ProjectQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<Project>>>> {
    let projects = ProjectRepository::get_all_projects(&state.pool, params).await?;
    Ok(Json(ApiResponse::success(projects)))
}

/// 获取当前用户创建的所有项目（不分页）
pub async fn get_my_all_projects(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(mut params): Query<ProjectQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<Project>>>> {
    params.creator_id = Some(Id(claims.sub));

    let projects = ProjectRepository::get_all_projects(&state.pool, params).await?;
    Ok(Json(ApiResponse::success(projects)))
}

/// 根据 ID 获取项目
pub async fn get_project_by_id(
    State(state): State<AppState>,
    Path(project_id): Path<Id>,
) -> AppResult<Json<ApiResponse<Project>>> {
    let project = ProjectRepository::get_project_by_id(&state.pool, project_id.0)
        .await?
        .ok_or(AppError::NotFound(format!("项目不存在: {}", project_id)))?;

    Ok(Json(ApiResponse::success(project)))
}

/// 根据项目名称获取项目
pub async fn get_project_by_name(
    State(state): State<AppState>,
    Path(project_name): Path<String>,
) -> AppResult<Json<ApiResponse<Project>>> {
    let project = ProjectRepository::get_project_by_name(&state.pool, &project_name)
        .await?
        .ok_or(AppError::NotFound(format!("项目不存在: {}", project_name)))?;

    Ok(Json(ApiResponse::success(project)))
}

/// 创建项目
pub async fn create_project(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(params): Json<CreateProjectParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<Project>>)> {
    let creator_id = claims.sub;
    let project_id = state
        .generate_id()
        .map_err(|e| AppError::InternalError(format!("生成项目ID失败: {}", e)))?;

    let project =
        ProjectRepository::create_project(&state.pool, project_id, params, creator_id).await?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(project))))
}

/// 更新项目
pub async fn update_project(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<Id>,
    Json(params): Json<UpdateProjectParams>,
) -> AppResult<Json<ApiResponse<Project>>> {
    let updater_id = claims.sub;

    let project = ProjectRepository::update_project(&state.pool, project_id.0, params, updater_id)
        .await?
        .ok_or(AppError::NotFound(format!("项目不存在: {}", project_id)))?;

    Ok(Json(ApiResponse::success(project)))
}

/// 删除项目
pub async fn delete_project(
    State(state): State<AppState>,
    Path(project_id): Path<Id>,
) -> AppResult<Json<ApiResponse<()>>> {
    let deleted = ProjectRepository::delete_project(&state.pool, project_id.0).await?;

    if !deleted {
        return Err(AppError::NotFound(format!("项目不存在: {}", project_id)));
    }

    Ok(Json(ApiResponse::success(())))
}

/// 批量删除项目
pub async fn batch_delete_projects(
    State(state): State<AppState>,
    Json(params): Json<BatchDeleteProjectsParams>,
) -> AppResult<Json<ApiResponse<u64>>> {
    let project_ids: Vec<i64> = params.ids.into_iter().map(|id| id.0).collect();
    let count = ProjectRepository::batch_delete_projects(&state.pool, project_ids).await?;

    Ok(Json(ApiResponse::success(count)))
}

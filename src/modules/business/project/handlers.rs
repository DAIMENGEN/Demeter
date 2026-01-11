use crate::common::error::{AppError, AppResult};
use crate::common::jwt::Claims;
use crate::common::response::{ApiResponse, PageResponse};
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
use sqlx::PgPool;

/// 获取项目列表（分页）
pub async fn get_project_list(
    State(pool): State<PgPool>,
    Query(params): Query<ProjectQueryParams>,
) -> AppResult<Json<ApiResponse<PageResponse<Project>>>> {
    let (projects, total) = ProjectRepository::get_project_list(&pool, params).await?;

    Ok(Json(ApiResponse::success(PageResponse {
        list: projects,
        total,
    })))
}

/// 获取所有项目（不分页）
pub async fn get_all_projects(
    State(pool): State<PgPool>,
    Query(params): Query<ProjectQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<Project>>>> {
    let projects = ProjectRepository::get_all_projects(&pool, params).await?;
    Ok(Json(ApiResponse::success(projects)))
}

/// 根据 ID 获取项目
pub async fn get_project_by_id(
    State(pool): State<PgPool>,
    Path(id): Path<i64>,
) -> AppResult<Json<ApiResponse<Project>>> {
    let project = ProjectRepository::get_project_by_id(&pool, id)
        .await?
        .ok_or(AppError::NotFound(format!("项目不存在: {}", id)))?;

    Ok(Json(ApiResponse::success(project)))
}

/// 根据项目名称获取项目
pub async fn get_project_by_name(
    State(pool): State<PgPool>,
    Path(project_name): Path<String>,
) -> AppResult<Json<ApiResponse<Project>>> {
    let project = ProjectRepository::get_project_by_name(&pool, &project_name)
        .await?
        .ok_or(AppError::NotFound(format!("项目不存在: {}", project_name)))?;

    Ok(Json(ApiResponse::success(project)))
}

/// 创建项目
pub async fn create_project(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
    Json(params): Json<CreateProjectParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<Project>>)> {
    // 从JWT令牌中获取当前用户ID（UUID格式）
    let creator_id = &claims.sub;

    let project = ProjectRepository::create_project(&pool, params, creator_id).await?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(project))))
}

/// 更新项目
pub async fn update_project(
    State(pool): State<PgPool>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<i64>,
    Json(params): Json<UpdateProjectParams>,
) -> AppResult<Json<ApiResponse<Project>>> {
    // 从JWT令牌中获取当前用户ID（UUID格式）
    let updater_id = &claims.sub;

    let project = ProjectRepository::update_project(&pool, id, params, updater_id)
        .await?
        .ok_or(AppError::NotFound(format!("项目不存在: {}", id)))?;

    Ok(Json(ApiResponse::success(project)))
}

/// 删除项目
pub async fn delete_project(
    State(pool): State<PgPool>,
    Path(id): Path<i64>,
) -> AppResult<Json<ApiResponse<()>>> {
    let deleted = ProjectRepository::delete_project(&pool, id).await?;

    if !deleted {
        return Err(AppError::NotFound(format!("项目不存在: {}", id)));
    }

    Ok(Json(ApiResponse::success(())))
}

/// 批量删除项目
pub async fn batch_delete_projects(
    State(pool): State<PgPool>,
    Json(params): Json<BatchDeleteProjectsParams>,
) -> AppResult<Json<ApiResponse<u64>>> {
    let count = ProjectRepository::batch_delete_projects(&pool, params.ids).await?;

    Ok(Json(ApiResponse::success(count)))
}

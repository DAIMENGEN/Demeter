use crate::common::app_state::AppState;
use crate::common::error::{AppError, AppResult};
use crate::common::id::Id;
use crate::common::jwt::Claims;
use crate::common::response::{ApiResponse, PaginatedResponse};
use crate::modules::business::project::models::{
    BatchDeleteProjectsParams, CreateProjectParams, Project, ProjectQueryParams,
    RecentlyVisitedQueryParams, ReorderProjectsParams, UpdateProjectParams,
};
use crate::modules::business::project::permission::models::{Permission, ProjectPermission};
use crate::modules::business::project::permission::repository::ProjectMemberRepository;
use crate::modules::business::project::repository::{ProjectRepository, ProjectVisitRepository};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension, Json,
};

pub async fn get_project_list(
    State(state): State<AppState>,
    Query(params): Query<ProjectQueryParams>,
) -> AppResult<Json<PaginatedResponse<Project>>> {
    let page = params.page.unwrap_or(1);
    let per_page = params.per_page.unwrap_or(20);
    let (projects, total) = ProjectRepository::get_project_list(&state.pool, params).await?;
    Ok(Json(PaginatedResponse::new(
        projects,
        total,
        page,
        per_page,
        "/api/v1/projects",
    )))
}

pub async fn get_my_project_list(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ProjectQueryParams>,
) -> AppResult<Json<PaginatedResponse<Project>>> {
    let page = params.page.unwrap_or(1);
    let per_page = params.per_page.unwrap_or(20);
    let creator_id = claims.sub;
    let (projects, total) =
        ProjectRepository::get_my_project_list(&state.pool, creator_id, params).await?;
    Ok(Json(PaginatedResponse::new(
        projects,
        total,
        page,
        per_page,
        "/api/v1/projects/my",
    )))
}

pub async fn get_all_projects(
    State(state): State<AppState>,
    Query(params): Query<ProjectQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<Project>>>> {
    let projects = ProjectRepository::get_all_projects(&state.pool, params).await?;
    Ok(Json(ApiResponse::success(projects)))
}

pub async fn get_my_all_projects(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ProjectQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<Project>>>> {
    let creator_id = claims.sub;
    let projects =
        ProjectRepository::get_my_all_projects(&state.pool, creator_id, params).await?;
    Ok(Json(ApiResponse::success(projects)))
}

pub async fn get_project_by_id(
    State(state): State<AppState>,
    Path(project_id): Path<Id>,
) -> AppResult<Json<ApiResponse<Project>>> {
    let project = ProjectRepository::get_project_by_id(&state.pool, project_id.0)
        .await?
        .ok_or(AppError::NotFound(format!(
            "Project not found: {}",
            project_id
        )))?;
    Ok(Json(ApiResponse::success(project)))
}

pub async fn get_project_by_name(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(project_name): Path<String>,
) -> AppResult<Json<ApiResponse<Project>>> {
    let project = ProjectRepository::get_project_by_name(&state.pool, &project_name)
        .await?
        .ok_or(AppError::NotFound(format!(
            "Project not found: {}",
            project_name
        )))?;

    // 非 super_admin 访问 Private 项目时，需检查是否有权限
    if !claims.is_super_admin() && project.visibility == 0 {
        use crate::modules::business::project::permission::repository::ProjectPermissionResolver;
        let has_role = ProjectPermissionResolver::resolve_role(&state.pool, project.id.0, claims.sub).await?;
        if has_role.is_none() && project.creator_id.0 != claims.sub {
            return Err(AppError::NotFound(format!(
                "Project not found: {}",
                project_name
            )));
        }
    }

    Ok(Json(ApiResponse::success(project)))
}

pub async fn create_project(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(params): Json<CreateProjectParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<Project>>)> {
    let creator_id = claims.sub;
    let project_id = state
        .generate_id()
        .map_err(|e| AppError::InternalError(format!("Failed to generate project ID: {}", e)))?;
    let project =
        ProjectRepository::create_project(&state.pool, project_id, params, creator_id).await?;

    // 自动将创建者添加为项目 Owner
    let member_id = state
        .generate_id()
        .map_err(|e| AppError::InternalError(format!("Failed to generate member ID: {}", e)))?;
    let owner_item = crate::modules::business::project::permission::models::AddMemberItem {
        user_id: Id(creator_id),
        role: crate::modules::business::project::permission::models::ProjectRole::Owner,
    };
    let _ = ProjectMemberRepository::add_members(
        &state.pool,
        project_id,
        vec![(member_id, &owner_item)],
    )
    .await;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(project))))
}

pub async fn update_project(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Extension(perm): Extension<ProjectPermission>,
    Path(project_id): Path<Id>,
    Json(params): Json<UpdateProjectParams>,
) -> AppResult<Json<ApiResponse<Project>>> {
    perm.require(Permission::ProjectEdit)?;
    let updater_id = claims.sub;
    let project = ProjectRepository::update_project(&state.pool, project_id.0, params, updater_id)
        .await?
        .ok_or(AppError::NotFound(format!(
            "Project not found: {}",
            project_id
        )))?;
    Ok(Json(ApiResponse::success(project)))
}

pub async fn delete_project(
    State(state): State<AppState>,
    Extension(perm): Extension<ProjectPermission>,
    Path(project_id): Path<Id>,
) -> AppResult<StatusCode> {
    perm.require(Permission::ProjectDelete)?;
    let deleted = ProjectRepository::delete_project(&state.pool, project_id.0).await?;
    if !deleted {
        return Err(AppError::NotFound(format!(
            "Project not found: {}",
            project_id
        )));
    }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn batch_delete_projects(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(params): Json<BatchDeleteProjectsParams>,
) -> AppResult<StatusCode> {
    if !claims.is_super_admin() {
        return Err(AppError::Forbidden(
            "Only super admin can batch delete projects".to_string(),
        ));
    }
    let project_ids: Vec<i64> = params.ids.into_iter().map(|id| id.0).collect();
    ProjectRepository::batch_delete_projects(&state.pool, project_ids).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn reorder_projects(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(params): Json<ReorderProjectsParams>,
) -> AppResult<StatusCode> {
    let project_ids: Vec<i64> = params.project_ids.into_iter().map(|id| id.0).collect();
    ProjectRepository::reorder_projects(&state.pool, claims.sub, project_ids).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn record_project_visit(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<Id>,
) -> AppResult<StatusCode> {
    let user_id = claims.sub;
    let visit_id = state
        .generate_id()
        .map_err(|e| AppError::InternalError(format!("Failed to generate visit ID: {}", e)))?;
    ProjectVisitRepository::record_visit(&state.pool, visit_id, user_id, project_id.0).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_recently_visited_projects(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<RecentlyVisitedQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<Project>>>> {
    let user_id = claims.sub;
    let projects =
        ProjectVisitRepository::get_recently_visited_projects(&state.pool, user_id, params)
            .await?;
    Ok(Json(ApiResponse::success(projects)))
}

pub async fn get_accessible_projects(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(params): Query<ProjectQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<Project>>>> {
    let projects =
        ProjectRepository::get_accessible_projects(&state.pool, claims.sub, params).await?;
    Ok(Json(ApiResponse::success(projects)))
}

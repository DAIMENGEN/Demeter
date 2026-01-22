use crate::common::app_state::AppState;
use crate::common::error::{AppError, AppResult};
use crate::common::id::Id;
use crate::common::jwt::Claims;
use crate::common::response::{ApiResponse, PageResponse};
use crate::modules::organization::department::models::{
    BatchDeleteDepartmentsParams, CreateDepartmentParams, Department, DepartmentQueryParams,
    UpdateDepartmentParams,
};
use crate::modules::organization::department::repository::DepartmentRepository;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension, Json,
};

pub async fn get_department_list(
    State(state): State<AppState>,
    Query(params): Query<DepartmentQueryParams>,
) -> AppResult<Json<ApiResponse<PageResponse<Department>>>> {
    let (departments, total) =
        DepartmentRepository::get_department_list(&state.pool, params).await?;
    Ok(Json(ApiResponse::success(PageResponse {
        list: departments,
        total,
    })))
}

pub async fn get_all_departments(
    State(state): State<AppState>,
    Query(params): Query<DepartmentQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<Department>>>> {
    let departments = DepartmentRepository::get_all_departments(&state.pool, params).await?;
    Ok(Json(ApiResponse::success(departments)))
}

pub async fn get_department_by_id(
    State(state): State<AppState>,
    Path(department_id): Path<Id>,
) -> AppResult<Json<ApiResponse<Department>>> {
    let department = DepartmentRepository::get_department_by_id(&state.pool, department_id.0)
        .await?
        .ok_or(AppError::NotFound(format!(
            "Department not found: {}",
            department_id
        )))?;
    Ok(Json(ApiResponse::success(department)))
}

pub async fn get_department_by_name(
    State(state): State<AppState>,
    Path(department_name): Path<String>,
) -> AppResult<Json<ApiResponse<Department>>> {
    let department = DepartmentRepository::get_department_by_name(&state.pool, &department_name)
        .await?
        .ok_or(AppError::NotFound(format!(
            "Department not found: {}",
            department_name
        )))?;

    Ok(Json(ApiResponse::success(department)))
}

pub async fn create_department(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(params): Json<CreateDepartmentParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<Department>>)> {
    let creator_id = claims.sub;
    let department_id = state
        .generate_id()
        .map_err(|e| AppError::InternalError(format!("Failed to generate department ID: {}", e)))?;
    let department =
        DepartmentRepository::create_department(&state.pool, department_id, params, creator_id)
            .await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success(department))))
}

pub async fn update_department(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(department_id): Path<Id>,
    Json(params): Json<UpdateDepartmentParams>,
) -> AppResult<Json<ApiResponse<Department>>> {
    let updater_id = claims.sub;
    let department =
        DepartmentRepository::update_department(&state.pool, department_id.0, params, updater_id)
            .await?
            .ok_or(AppError::NotFound(format!(
                "Department not found: {}",
                department_id
            )))?;
    Ok(Json(ApiResponse::success(department)))
}

pub async fn delete_department(
    State(state): State<AppState>,
    Path(department_id): Path<Id>,
) -> AppResult<Json<ApiResponse<()>>> {
    let deleted = DepartmentRepository::delete_department(&state.pool, department_id.0).await?;
    if !deleted {
        return Err(AppError::NotFound(format!(
            "Department not found: {}",
            department_id
        )));
    }
    Ok(Json(ApiResponse::success(())))
}

pub async fn batch_delete_departments(
    State(state): State<AppState>,
    Json(params): Json<BatchDeleteDepartmentsParams>,
) -> AppResult<Json<ApiResponse<()>>> {
    let department_ids: Vec<i64> = params.ids.into_iter().map(|id| id.0).collect();
    DepartmentRepository::batch_delete_departments(&state.pool, department_ids).await?;
    Ok(Json(ApiResponse::success(())))
}

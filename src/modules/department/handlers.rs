use crate::common::error::{AppError, AppResult};
use crate::common::response::{ApiResponse, PageResponse};
use crate::modules::department::models::{
    BatchDeleteDepartmentsParams, CreateDepartmentParams, Department, DepartmentQueryParams,
    UpdateDepartmentParams,
};
use crate::modules::department::repository::DepartmentRepository;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use sqlx::PgPool;

/// 获取部门列表（分页）
pub async fn get_department_list(
    State(pool): State<PgPool>,
    Query(params): Query<DepartmentQueryParams>,
) -> AppResult<Json<ApiResponse<PageResponse<Department>>>> {
    let (departments, total) = DepartmentRepository::get_department_list(&pool, params).await?;

    Ok(Json(ApiResponse::success(PageResponse {
        list: departments,
        total,
    })))
}

/// 获取所有部门（不分页）
pub async fn get_all_departments(
    State(pool): State<PgPool>,
    Query(params): Query<DepartmentQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<Department>>>> {
    let departments = DepartmentRepository::get_all_departments(&pool, params).await?;
    Ok(Json(ApiResponse::success(departments)))
}

/// 根据 ID 获取部门
pub async fn get_department_by_id(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> AppResult<Json<ApiResponse<Department>>> {
    let department = DepartmentRepository::get_department_by_id(&pool, &id)
        .await?
        .ok_or(AppError::NotFound(format!("部门不存在: {}", id)))?;

    Ok(Json(ApiResponse::success(department)))
}

/// 根据部门名称获取部门
pub async fn get_department_by_name(
    State(pool): State<PgPool>,
    Path(department_name): Path<String>,
) -> AppResult<Json<ApiResponse<Department>>> {
    let department = DepartmentRepository::get_department_by_name(&pool, &department_name)
        .await?
        .ok_or(AppError::NotFound(format!(
            "部门不存在: {}",
            department_name
        )))?;

    Ok(Json(ApiResponse::success(department)))
}

/// 创建部门
pub async fn create_department(
    State(pool): State<PgPool>,
    Json(params): Json<CreateDepartmentParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<Department>>)> {
    // TODO: 从认证中间件获取当前用户ID
    let creator_id = "system";

    let department = DepartmentRepository::create_department(&pool, params, creator_id).await?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(department))))
}

/// 更新部门
pub async fn update_department(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
    Json(params): Json<UpdateDepartmentParams>,
) -> AppResult<Json<ApiResponse<Department>>> {
    // TODO: 从认证中间件获取当前用户ID
    let updater_id = "system";

    let department = DepartmentRepository::update_department(&pool, &id, params, updater_id)
        .await?
        .ok_or(AppError::NotFound(format!("部门不存在: {}", id)))?;

    Ok(Json(ApiResponse::success(department)))
}

/// 删除部门
pub async fn delete_department(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> AppResult<Json<ApiResponse<()>>> {
    let deleted = DepartmentRepository::delete_department(&pool, &id).await?;

    if !deleted {
        return Err(AppError::NotFound(format!("部门不存在: {}", id)));
    }

    Ok(Json(ApiResponse::success(())))
}

/// 批量删除部门
pub async fn batch_delete_departments(
    State(pool): State<PgPool>,
    Json(params): Json<BatchDeleteDepartmentsParams>,
) -> AppResult<Json<ApiResponse<()>>> {
    DepartmentRepository::batch_delete_departments(&pool, params.ids).await?;
    Ok(Json(ApiResponse::success(())))
}

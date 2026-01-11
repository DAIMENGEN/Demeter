use crate::common::error::{AppError, AppResult};
use crate::common::response::{ApiResponse, PageResponse};
use crate::modules::hr::holiday::models::{
    BatchDeleteHolidaysParams, CreateHolidayParams, Holiday, HolidayQueryParams,
    UpdateHolidayParams,
};
use crate::modules::hr::holiday::repository::HolidayRepository;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use sqlx::PgPool;

/// 获取假期列表（分页）
pub async fn get_holiday_list(
    State(pool): State<PgPool>,
    Query(params): Query<HolidayQueryParams>,
) -> AppResult<Json<ApiResponse<PageResponse<Holiday>>>> {
    let (holidays, total) = HolidayRepository::get_holiday_list(&pool, params).await?;

    Ok(Json(ApiResponse::success(PageResponse {
        list: holidays,
        total,
    })))
}

/// 获取所有假期（不分页）
pub async fn get_all_holidays(
    State(pool): State<PgPool>,
    Query(params): Query<HolidayQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<Holiday>>>> {
    let holidays = HolidayRepository::get_all_holidays(&pool, params).await?;
    Ok(Json(ApiResponse::success(holidays)))
}

/// 根据 ID 获取假期
pub async fn get_holiday_by_id(
    State(pool): State<PgPool>,
    Path(id): Path<i64>,
) -> AppResult<Json<ApiResponse<Holiday>>> {
    let holiday = HolidayRepository::get_holiday_by_id(&pool, id)
        .await?
        .ok_or(AppError::NotFound(format!("假期不存在: {}", id)))?;

    Ok(Json(ApiResponse::success(holiday)))
}

/// 创建假期
pub async fn create_holiday(
    State(pool): State<PgPool>,
    Json(params): Json<CreateHolidayParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<Holiday>>)> {
    // TODO: 从认证中间件获取当前用户ID
    let creator_id = 1i64;

    let holiday = HolidayRepository::create_holiday(&pool, params, creator_id).await?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(holiday))))
}

/// 更新假期
pub async fn update_holiday(
    State(pool): State<PgPool>,
    Path(id): Path<i64>,
    Json(params): Json<UpdateHolidayParams>,
) -> AppResult<Json<ApiResponse<Holiday>>> {
    // TODO: 从认证中间件获取当前用户ID
    let updater_id = 1i64;

    let holiday = HolidayRepository::update_holiday(&pool, id, params, updater_id)
        .await?
        .ok_or(AppError::NotFound(format!("假期不存在: {}", id)))?;

    Ok(Json(ApiResponse::success(holiday)))
}

/// 删除假期
pub async fn delete_holiday(
    State(pool): State<PgPool>,
    Path(id): Path<i64>,
) -> AppResult<Json<ApiResponse<()>>> {
    let deleted = HolidayRepository::delete_holiday(&pool, id).await?;

    if !deleted {
        return Err(AppError::NotFound(format!("假期不存在: {}", id)));
    }

    Ok(Json(ApiResponse::success(())))
}

/// 批量删除假期
pub async fn batch_delete_holidays(
    State(pool): State<PgPool>,
    Json(params): Json<BatchDeleteHolidaysParams>,
) -> AppResult<Json<ApiResponse<i64>>> {
    let deleted_count = HolidayRepository::batch_delete_holidays(&pool, params.ids).await?;

    Ok(Json(ApiResponse::success(deleted_count)))
}


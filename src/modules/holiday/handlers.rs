use crate::common::app_state::AppState;
use crate::common::error::{AppError, AppResult};
use crate::common::id::Id;
use crate::common::jwt::Claims;
use crate::common::response::{ApiResponse, PageResponse};
use crate::modules::holiday::models::{
    BatchCreateHolidaysParams, BatchDeleteHolidaysParams, BatchUpdateHolidaysParams,
    CreateHolidayParams, Holiday, HolidayQueryParams, UpdateHolidayParams,
};
use crate::modules::holiday::repository::HolidayRepository;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension, Json,
};

pub async fn get_holiday_list(
    State(state): State<AppState>,
    Query(params): Query<HolidayQueryParams>,
) -> AppResult<Json<ApiResponse<PageResponse<Holiday>>>> {
    let (holidays, total) = HolidayRepository::get_holiday_list(&state.pool, params).await?;
    Ok(Json(ApiResponse::success(PageResponse {
        list: holidays,
        total,
    })))
}

pub async fn get_all_holidays(
    State(state): State<AppState>,
    Query(params): Query<HolidayQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<Holiday>>>> {
    let holidays = HolidayRepository::get_all_holidays(&state.pool, params).await?;
    Ok(Json(ApiResponse::success(holidays)))
}

pub async fn get_holiday_by_id(
    State(state): State<AppState>,
    Path(holiday_id): Path<Id>,
) -> AppResult<Json<ApiResponse<Holiday>>> {
    let holiday = HolidayRepository::get_holiday_by_id(&state.pool, holiday_id.0)
        .await?
        .ok_or(AppError::NotFound(format!("假期不存在: {}", holiday_id)))?;

    Ok(Json(ApiResponse::success(holiday)))
}

pub async fn create_holiday(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(params): Json<CreateHolidayParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<Holiday>>)> {
    let creator_id = claims.sub;
    let holiday_id = state
        .generate_id()
        .map_err(|e| AppError::InternalError(format!("生成假期ID失败: {}", e)))?;
    let holiday =
        HolidayRepository::create_holiday(&state.pool, holiday_id, params, creator_id).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success(holiday))))
}

pub async fn update_holiday(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(holiday_id): Path<Id>,
    Json(params): Json<UpdateHolidayParams>,
) -> AppResult<Json<ApiResponse<Holiday>>> {
    let updater_id = claims.sub;
    let holiday = HolidayRepository::update_holiday(&state.pool, holiday_id.0, params, updater_id)
        .await?
        .ok_or(AppError::NotFound(format!("假期不存在: {}", holiday_id)))?;
    Ok(Json(ApiResponse::success(holiday)))
}

pub async fn delete_holiday(
    State(state): State<AppState>,
    Path(holiday_id): Path<Id>,
) -> AppResult<Json<ApiResponse<()>>> {
    let deleted = HolidayRepository::delete_holiday(&state.pool, holiday_id.0).await?;
    if !deleted {
        return Err(AppError::NotFound(format!("假期不存在: {}", holiday_id)));
    }
    Ok(Json(ApiResponse::success(())))
}

pub async fn batch_delete_holidays(
    State(state): State<AppState>,
    Json(params): Json<BatchDeleteHolidaysParams>,
) -> AppResult<Json<ApiResponse<u64>>> {
    let holiday_ids: Vec<i64> = params.ids.into_iter().map(|id| id.0).collect();
    let deleted_count = HolidayRepository::batch_delete_holidays(&state.pool, holiday_ids).await?;
    Ok(Json(ApiResponse::success(deleted_count)))
}

pub async fn batch_create_holidays(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(params): Json<BatchCreateHolidaysParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<Vec<Holiday>>>)> {
    let creator_id = claims.sub;
    let mut holiday_ids = Vec::new();
    for _ in 0..params.holidays.len() {
        let id = state
            .generate_id()
            .map_err(|e| AppError::InternalError(format!("生成假期ID失败: {}", e)))?;
        holiday_ids.push(id);
    }
    let holidays = HolidayRepository::batch_create_holidays(
        &state.pool,
        holiday_ids,
        params.holidays,
        creator_id,
    )
    .await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success(holidays))))
}

pub async fn batch_update_holidays(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(params): Json<BatchUpdateHolidaysParams>,
) -> AppResult<Json<ApiResponse<Vec<Holiday>>>> {
    let updater_id = claims.sub;
    let holiday_ids: Vec<i64> = params.ids.into_iter().map(|id| id.0).collect();
    let holidays = HolidayRepository::batch_update_holidays(
        &state.pool,
        holiday_ids,
        params.holiday_name,
        params.description,
        params.holiday_type,
        updater_id,
    )
    .await?;
    Ok(Json(ApiResponse::success(holidays)))
}

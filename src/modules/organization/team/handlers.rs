use crate::common::error::{AppError, AppResult};
use crate::common::response::{ApiResponse, PageResponse};
use crate::modules::organization::team::models::{
    BatchDeleteTeamsParams, CreateTeamParams, Team, TeamQueryParams,
    UpdateTeamParams,
};
use crate::modules::organization::team::repository::TeamRepository;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use sqlx::PgPool;
/// 获取团队列表（分页）
pub async fn get_team_list(
    State(pool): State<PgPool>,
    Query(params): Query<TeamQueryParams>,
) -> AppResult<Json<ApiResponse<PageResponse<Team>>>> {
    let (teams, total) = TeamRepository::get_team_list(&pool, params).await?;
    Ok(Json(ApiResponse::success(PageResponse {
        list: teams,
        total,
    })))
}
/// 获取所有团队（不分页）
pub async fn get_all_teams(
    State(pool): State<PgPool>,
    Query(params): Query<TeamQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<Team>>>> {
    let teams = TeamRepository::get_all_teams(&pool, params).await?;
    Ok(Json(ApiResponse::success(teams)))
}
/// 根据 ID 获取团队
pub async fn get_team_by_id(
    State(pool): State<PgPool>,
    Path(id): Path<i64>,
) -> AppResult<Json<ApiResponse<Team>>> {
    let team = TeamRepository::get_team_by_id(&pool, id)
        .await?
        .ok_or(AppError::NotFound(format!("团队不存在: {}", id)))?;
    Ok(Json(ApiResponse::success(team)))
}
/// 根据团队名称获取团队
pub async fn get_team_by_name(
    State(pool): State<PgPool>,
    Path(team_name): Path<String>,
) -> AppResult<Json<ApiResponse<Team>>> {
    let team = TeamRepository::get_team_by_name(&pool, &team_name)
        .await?
        .ok_or(AppError::NotFound(format!(
            "团队不存在: {}",
            team_name
        )))?;
    Ok(Json(ApiResponse::success(team)))
}
/// 创建团队
pub async fn create_team(
    State(pool): State<PgPool>,
    Json(params): Json<CreateTeamParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<Team>>)> {
    // TODO: 从认证中间件获取当前用户ID
    let creator_id = 1; // 临时使用默认值
    let team = TeamRepository::create_team(&pool, params, creator_id).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success(team))))
}
/// 更新团队
pub async fn update_team(
    State(pool): State<PgPool>,
    Path(id): Path<i64>,
    Json(params): Json<UpdateTeamParams>,
) -> AppResult<Json<ApiResponse<Team>>> {
    // TODO: 从认证中间件获取当前用户ID
    let updater_id = 1; // 临时使用默认值
    let team = TeamRepository::update_team(&pool, id, params, updater_id)
        .await?
        .ok_or(AppError::NotFound(format!("团队不存在: {}", id)))?;
    Ok(Json(ApiResponse::success(team)))
}
/// 删除团队
pub async fn delete_team(
    State(pool): State<PgPool>,
    Path(id): Path<i64>,
) -> AppResult<Json<ApiResponse<()>>> {
    let deleted = TeamRepository::delete_team(&pool, id).await?;
    if !deleted {
        return Err(AppError::NotFound(format!("团队不存在: {}", id)));
    }
    Ok(Json(ApiResponse::success(())))
}
/// 批量删除团队
pub async fn batch_delete_teams(
    State(pool): State<PgPool>,
    Json(params): Json<BatchDeleteTeamsParams>,
) -> AppResult<Json<ApiResponse<()>>> {
    TeamRepository::batch_delete_teams(&pool, params.ids).await?;
    Ok(Json(ApiResponse::success(())))
}

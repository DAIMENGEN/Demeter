use crate::common::app_state::AppState;
use crate::common::error::{AppError, AppResult};
use crate::common::id::Id;
use crate::common::jwt::Claims;
use crate::common::response::{ApiResponse, PaginatedResponse};
use crate::modules::organization::team::models::{
    BatchDeleteTeamsParams, CreateTeamParams, Team, TeamQueryParams, UpdateTeamParams,
};
use crate::modules::organization::team::repository::TeamRepository;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension, Json,
};

pub async fn get_team_list(
    State(state): State<AppState>,
    Query(params): Query<TeamQueryParams>,
) -> AppResult<Json<PaginatedResponse<Team>>> {
    let page = params.page.unwrap_or(1);
    let per_page = params.per_page.unwrap_or(20);
    let (teams, total) = TeamRepository::get_team_list(&state.pool, params).await?;
    Ok(Json(PaginatedResponse::new(
        teams,
        total,
        page,
        per_page,
        "/api/v1/teams",
    )))
}

pub async fn get_all_teams(
    State(state): State<AppState>,
    Query(params): Query<TeamQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<Team>>>> {
    let teams = TeamRepository::get_all_teams(&state.pool, params).await?;
    Ok(Json(ApiResponse::success(teams)))
}

pub async fn get_team_by_id(
    State(state): State<AppState>,
    Path(team_id): Path<Id>,
) -> AppResult<Json<ApiResponse<Team>>> {
    let team = TeamRepository::get_team_by_id(&state.pool, team_id.0)
        .await?
        .ok_or(AppError::NotFound(format!("Team not found: {}", team_id)))?;
    Ok(Json(ApiResponse::success(team)))
}

pub async fn get_team_by_name(
    State(state): State<AppState>,
    Path(team_name): Path<String>,
) -> AppResult<Json<ApiResponse<Team>>> {
    let team = TeamRepository::get_team_by_name(&state.pool, &team_name)
        .await?
        .ok_or(AppError::NotFound(format!("Team not found: {}", team_name)))?;
    Ok(Json(ApiResponse::success(team)))
}

pub async fn create_team(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(params): Json<CreateTeamParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<Team>>)> {
    let creator_id = claims.sub;
    let team_id = state
        .generate_id()
        .map_err(|e| AppError::InternalError(format!("Failed to generate team ID: {}", e)))?;
    let team = TeamRepository::create_team(&state.pool, team_id, params, creator_id).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success(team))))
}

pub async fn update_team(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(team_id): Path<Id>,
    Json(params): Json<UpdateTeamParams>,
) -> AppResult<Json<ApiResponse<Team>>> {
    let updater_id = claims.sub;
    let team = TeamRepository::update_team(&state.pool, team_id.0, params, updater_id)
        .await?
        .ok_or(AppError::NotFound(format!("Team not found: {}", team_id)))?;
    Ok(Json(ApiResponse::success(team)))
}

pub async fn delete_team(
    State(state): State<AppState>,
    Path(team_id): Path<Id>,
) -> AppResult<StatusCode> {
    let deleted = TeamRepository::delete_team(&state.pool, team_id.0).await?;
    if !deleted {
        return Err(AppError::NotFound(format!("Team not found: {}", team_id)));
    }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn batch_delete_teams(
    State(state): State<AppState>,
    Json(params): Json<BatchDeleteTeamsParams>,
) -> AppResult<StatusCode> {
    let team_ids: Vec<i64> = params.ids.into_iter().map(|id| id.0).collect();
    TeamRepository::batch_delete_teams(&state.pool, team_ids).await?;
    Ok(StatusCode::NO_CONTENT)
}

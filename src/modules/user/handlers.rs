use crate::common::app_state::AppState;
use crate::common::error::{AppError, AppResult};
use crate::common::jwt::Claims;
use crate::common::response::{ApiResponse, PageResponse};
use crate::common::id::Id;
use crate::modules::user::models::{
    BatchDeleteUsersParams, CreateUserParams, ToggleUserStatusParams, UpdateUserParams, User,
    UserQueryParams,
};
use crate::modules::user::repository::UserRepository;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension, Json,
};

/// 获取用户列表（分页）
pub async fn get_user_list(
    State(state): State<AppState>,
    Query(params): Query<UserQueryParams>,
) -> AppResult<Json<ApiResponse<PageResponse<User>>>> {
    let (users, total) = UserRepository::get_user_list(&state.pool, params).await?;

    Ok(Json(ApiResponse::success(PageResponse {
        list: users,
        total,
    })))
}

/// 获取所有用户（不分页）
pub async fn get_all_users(
    State(state): State<AppState>,
    Query(params): Query<UserQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<User>>>> {
    let users = UserRepository::get_all_users(&state.pool, params).await?;
    Ok(Json(ApiResponse::success(users)))
}

/// 根据 ID 获取用户
pub async fn get_user_by_id(
    State(state): State<AppState>,
    Path(id): Path<Id>,
) -> AppResult<Json<ApiResponse<User>>> {
    let user = UserRepository::get_user_by_id(&state.pool, id.0)
        .await?
        .ok_or(AppError::NotFound(format!("用户不存在: {}", id)))?;
    Ok(Json(ApiResponse::success(user)))
}

/// 根据用户名获取用户
pub async fn get_user_by_username(
    State(state): State<AppState>,
    Path(username): Path<String>,
) -> AppResult<Json<ApiResponse<User>>> {
    let user = UserRepository::get_user_by_username(&state.pool, &username)
        .await?
        .ok_or(AppError::NotFound(format!("用户不存在: {}", username)))?;

    Ok(Json(ApiResponse::success(user)))
}

/// 创建用户
pub async fn create_user(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(params): Json<CreateUserParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<User>>)> {
    let creator_id = claims.sub;
    let user_id = state
        .generate_id()
        .map_err(|e| AppError::InternalError(format!("生成用户ID失败: {}", e)))?;
    let user = UserRepository::create_user(&state.pool, user_id, params, creator_id).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success(user))))
}

/// 更新用户
pub async fn update_user(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Id>,
    Json(params): Json<UpdateUserParams>,
) -> AppResult<Json<ApiResponse<User>>> {
    let updater_id = claims.sub;
    let user = UserRepository::update_user(&state.pool, id.0, params, updater_id)
        .await?
        .ok_or(AppError::NotFound(format!("用户不存在: {}", id)))?;
    Ok(Json(ApiResponse::success(user)))
}

/// 删除用户
pub async fn delete_user(
    State(state): State<AppState>,
    Path(id): Path<Id>,
) -> AppResult<Json<ApiResponse<()>>> {
    let deleted = UserRepository::delete_user(&state.pool, id.0).await?;

    if !deleted {
        return Err(AppError::NotFound(format!("用户不存在: {}", id)));
    }

    Ok(Json(ApiResponse::success(())))
}

/// 批量删除用户
pub async fn batch_delete_users(
    State(state): State<AppState>,
    Json(params): Json<BatchDeleteUsersParams>,
) -> AppResult<Json<ApiResponse<()>>> {
    let ids: Vec<i64> = params.ids.into_iter().map(|id| id.0).collect();
    UserRepository::batch_delete_users(&state.pool, ids).await?;
    Ok(Json(ApiResponse::success(())))
}

/// 切换用户状态
pub async fn toggle_user_status(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Id>,
    Json(params): Json<ToggleUserStatusParams>,
) -> AppResult<Json<ApiResponse<User>>> {
    // TODO: 从认证中间件获取当前用户ID
    let updater_id = claims.sub;
    let user = UserRepository::toggle_user_status(&state.pool, id.0, params.is_active, updater_id)
        .await?
        .ok_or(AppError::NotFound(format!("用户不存在: {}", id)))?;
    Ok(Json(ApiResponse::success(user)))
}

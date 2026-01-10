use crate::common::error::{AppError, AppResult};
use crate::common::response::{ApiResponse, PageResponse};
use crate::modules::user::models::{
    BatchDeleteUsersParams, CreateUserParams, ToggleUserStatusParams, UpdateUserParams, User,
    UserQueryParams,
};
use crate::modules::user::repository::UserRepository;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use sqlx::PgPool;

/// 获取用户列表（分页）
pub async fn get_user_list(
    State(pool): State<PgPool>,
    Query(params): Query<UserQueryParams>,
) -> AppResult<Json<ApiResponse<PageResponse<User>>>> {
    let (users, total) = UserRepository::get_user_list(&pool, params).await?;

    Ok(Json(ApiResponse::success(PageResponse {
        list: users,
        total,
    })))
}

/// 获取所有用户（不分页）
pub async fn get_all_users(
    State(pool): State<PgPool>,
    Query(params): Query<UserQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<User>>>> {
    let users = UserRepository::get_all_users(&pool, params).await?;
    Ok(Json(ApiResponse::success(users)))
}

/// 根据 ID 获取用户
pub async fn get_user_by_id(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> AppResult<Json<ApiResponse<User>>> {
    let user = UserRepository::get_user_by_id(&pool, &id)
        .await?
        .ok_or(AppError::NotFound(format!("用户不存在: {}", id)))?;

    Ok(Json(ApiResponse::success(user)))
}

/// 根据用户名获取用户
pub async fn get_user_by_username(
    State(pool): State<PgPool>,
    Path(username): Path<String>,
) -> AppResult<Json<ApiResponse<User>>> {
    let user = UserRepository::get_user_by_username(&pool, &username)
        .await?
        .ok_or(AppError::NotFound(format!("用户不存在: {}", username)))?;

    Ok(Json(ApiResponse::success(user)))
}

/// 创建用户
pub async fn create_user(
    State(pool): State<PgPool>,
    Json(params): Json<CreateUserParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<User>>)> {
    // TODO: 从认证中间件获取当前用户ID
    let creator_id = "system";

    let user = UserRepository::create_user(&pool, params, creator_id).await?;

    Ok((StatusCode::CREATED, Json(ApiResponse::success(user))))
}

/// 更新用户
pub async fn update_user(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
    Json(params): Json<UpdateUserParams>,
) -> AppResult<Json<ApiResponse<User>>> {
    // TODO: 从认证中间件获取当前用户ID
    let updater_id = "system";

    let user = UserRepository::update_user(&pool, &id, params, updater_id)
        .await?
        .ok_or(AppError::NotFound(format!("用户不存在: {}", id)))?;

    Ok(Json(ApiResponse::success(user)))
}

/// 删除用户
pub async fn delete_user(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
) -> AppResult<Json<ApiResponse<()>>> {
    let deleted = UserRepository::delete_user(&pool, &id).await?;

    if !deleted {
        return Err(AppError::NotFound(format!("用户不存在: {}", id)));
    }

    Ok(Json(ApiResponse::success(())))
}

/// 批量删除用户
pub async fn batch_delete_users(
    State(pool): State<PgPool>,
    Json(params): Json<BatchDeleteUsersParams>,
) -> AppResult<Json<ApiResponse<()>>> {
    UserRepository::batch_delete_users(&pool, params.ids).await?;
    Ok(Json(ApiResponse::success(())))
}

/// 切换用户状态
pub async fn toggle_user_status(
    State(pool): State<PgPool>,
    Path(id): Path<String>,
    Json(params): Json<ToggleUserStatusParams>,
) -> AppResult<Json<ApiResponse<User>>> {
    // TODO: 从认证中间件获取当前用户ID
    let updater_id = "system";

    let user = UserRepository::toggle_user_status(&pool, &id, params.is_active, updater_id)
        .await?
        .ok_or(AppError::NotFound(format!("用户不存在: {}", id)))?;

    Ok(Json(ApiResponse::success(user)))
}

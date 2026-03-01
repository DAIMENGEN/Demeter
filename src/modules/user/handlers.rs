use crate::common::app_state::AppState;
use crate::common::error::{AppError, AppResult};
use crate::common::id::Id;
use crate::common::jwt::Claims;
use crate::common::response::{ApiResponse, PageResponse};
use crate::modules::user::models::{
    BatchDeleteUsersParams, CreateUserParams, ResetPasswordResponse, ToggleUserStatusParams,
    UpdateProfileParams, UpdateUserParams, UserQueryParams,
};
use crate::modules::user::repository::UserRepository;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension, Json,
};

pub async fn get_user_list(
    State(state): State<AppState>,
    Query(params): Query<UserQueryParams>,
) -> AppResult<Json<ApiResponse<PageResponse<crate::modules::user::models::User>>>> {
    let (users, total) = UserRepository::get_user_list(&state.pool, params).await?;
    Ok(Json(ApiResponse::success(PageResponse {
        list: users,
        total,
    })))
}

pub async fn get_all_users(
    State(state): State<AppState>,
    Query(params): Query<UserQueryParams>,
) -> AppResult<Json<ApiResponse<Vec<crate::modules::user::models::User>>>> {
    let users = UserRepository::get_all_users(&state.pool, params).await?;
    Ok(Json(ApiResponse::success(users)))
}

pub async fn get_user_by_id(
    State(state): State<AppState>,
    Path(id): Path<Id>,
) -> AppResult<Json<ApiResponse<crate::modules::user::models::User>>> {
    let user = UserRepository::get_user_by_id(&state.pool, id.0)
        .await?
        .ok_or(AppError::NotFound(format!("User not found: {}", id)))?;
    Ok(Json(ApiResponse::success(user)))
}

pub async fn get_user_by_username(
    State(state): State<AppState>,
    Path(username): Path<String>,
) -> AppResult<Json<ApiResponse<crate::modules::user::models::User>>> {
    let user = UserRepository::get_user_by_username(&state.pool, &username)
        .await?
        .ok_or(AppError::NotFound(format!("User not found: {}", username)))?;
    Ok(Json(ApiResponse::success(user)))
}

pub async fn create_user(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(params): Json<CreateUserParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<crate::modules::user::models::User>>)> {
    if params.username.is_empty() || params.password.is_empty() {
        return Err(AppError::BadRequest(
            "Username and password cannot be empty".to_string(),
        ));
    }

    if params.password.len() < 8 {
        return Err(AppError::BadRequest(
            "Password must be at least 8 characters".to_string(),
        ));
    }

    let password_hash = bcrypt::hash(&params.password, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::InternalError(format!("Failed to hash password: {}", e)))?;

    let creator_id = claims.sub;
    let user_id = state
        .generate_id()
        .map_err(|e| AppError::InternalError(format!("Failed to generate user ID: {}", e)))?;

    let id_gen = state.id_generator.clone();
    let generate_id = move || id_gen.get_id();

    let user = UserRepository::create_user(
        &state.pool,
        user_id,
        params,
        &password_hash,
        creator_id,
        generate_id,
    )
    .await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success(user))))
}

pub async fn update_user(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Id>,
    Json(params): Json<UpdateUserParams>,
) -> AppResult<Json<ApiResponse<crate::modules::user::models::User>>> {
    let updater_id = claims.sub;

    // Hash password if provided
    let password_hash = match &params.password {
        Some(pw) if !pw.is_empty() => {
            if pw.len() < 8 {
                return Err(AppError::BadRequest(
                    "Password must be at least 8 characters".to_string(),
                ));
            }
            Some(
                bcrypt::hash(pw, bcrypt::DEFAULT_COST)
                    .map_err(|e| AppError::InternalError(format!("Failed to hash password: {}", e)))?,
            )
        }
        _ => None,
    };

    let id_gen = state.id_generator.clone();
    let generate_id = move || id_gen.get_id();

    let user = UserRepository::update_user(
        &state.pool,
        id.0,
        params,
        password_hash.as_deref(),
        updater_id,
        generate_id,
    )
    .await?
    .ok_or(AppError::NotFound(format!("User not found: {}", id)))?;
    Ok(Json(ApiResponse::success(user)))
}

pub async fn delete_user(
    State(state): State<AppState>,
    Path(id): Path<Id>,
) -> AppResult<Json<ApiResponse<()>>> {
    let deleted = UserRepository::delete_user(&state.pool, id.0).await?;
    if !deleted {
        return Err(AppError::NotFound(format!("User not found: {}", id)));
    }
    Ok(Json(ApiResponse::success(())))
}

pub async fn batch_delete_users(
    State(state): State<AppState>,
    Json(params): Json<BatchDeleteUsersParams>,
) -> AppResult<Json<ApiResponse<()>>> {
    let ids: Vec<i64> = params.ids.into_iter().map(|id| id.0).collect();
    UserRepository::batch_delete_users(&state.pool, ids).await?;
    Ok(Json(ApiResponse::success(())))
}

pub async fn toggle_user_status(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Id>,
    Json(params): Json<ToggleUserStatusParams>,
) -> AppResult<Json<ApiResponse<crate::modules::user::models::User>>> {
    let updater_id = claims.sub;
    let user = UserRepository::toggle_user_status(&state.pool, id.0, params.is_active, updater_id)
        .await?
        .ok_or(AppError::NotFound(format!("User not found: {}", id)))?;
    Ok(Json(ApiResponse::success(user)))
}

pub async fn reset_password(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Id>,
) -> AppResult<Json<ApiResponse<ResetPasswordResponse>>> {
    let updater_id = claims.sub;

    // Generate temporary password: 12-char alphanumeric
    let temp_password = format!(
        "Tmp{}",
        &uuid::Uuid::new_v4().to_string().replace('-', "")[..9]
    );

    let password_hash = bcrypt::hash(&temp_password, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::InternalError(format!("Failed to hash password: {}", e)))?;

    let deleted = UserRepository::reset_password(&state.pool, id.0, &password_hash, updater_id)
        .await?;
    if !deleted {
        return Err(AppError::NotFound(format!("User not found: {}", id)));
    }

    Ok(Json(ApiResponse::success(ResetPasswordResponse {
        temporary_password: temp_password,
    })))
}

/// 用户修改自己的个人资料（仅 full_name / email / phone）。
pub async fn update_profile(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(params): Json<UpdateProfileParams>,
) -> AppResult<Json<ApiResponse<crate::modules::user::models::User>>> {
    let user = UserRepository::update_profile(&state.pool, claims.sub, params)
        .await?
        .ok_or(AppError::NotFound("User not found".to_string()))?;
    Ok(Json(ApiResponse::success(user)))
}

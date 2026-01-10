use crate::common::error::{AppError, AppResult};
use crate::common::jwt::JwtUtil;
use crate::common::response::ApiResponse;
use crate::config::JwtConfig;
use crate::modules::auth::models::{
    AuthResponse, LoginRequest, RefreshTokenRequest, RegisterRequest, UserInfo,
};
use crate::modules::auth::repository::AuthRepository;
use axum::{extract::State, http::StatusCode, Json};
use sqlx::PgPool;

/// 应用状态
#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub jwt_config: JwtConfig,
}

/// 用户注册
pub async fn register(
    State(state): State<AppState>,
    Json(request): Json<RegisterRequest>,
) -> AppResult<(StatusCode, Json<ApiResponse<AuthResponse>>)> {
    // 验证输入
    if request.username.is_empty() || request.password.is_empty() {
        return Err(AppError::BadRequest("用户名和密码不能为空".to_string()));
    }

    if request.password.len() < 6 {
        return Err(AppError::BadRequest("密码长度至少为6位".to_string()));
    }

    // 检查用户名是否已存在
    if AuthRepository::check_username_exists(&state.pool, &request.username).await? {
        return Err(AppError::BadRequest("用户名已存在".to_string()));
    }

    // 检查邮箱是否已存在
    if AuthRepository::check_email_exists(&state.pool, &request.email).await? {
        return Err(AppError::BadRequest("邮箱已被注册".to_string()));
    }

    // 加密密码
    let password_hash = bcrypt::hash(&request.password, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::InternalError(format!("密码加密失败: {}", e)))?;

    // 创建用户
    let user = AuthRepository::create_user(
        &state.pool,
        &request.username,
        &password_hash,
        &request.full_name,
        &request.email,
        request.phone.as_deref(),
    )
    .await?;

    // 生成令牌
    let access_token = JwtUtil::generate_access_token(&user.id, &user.username, &state.jwt_config)?;
    let refresh_token =
        JwtUtil::generate_refresh_token(&user.id, &user.username, &state.jwt_config)?;

    // 保存刷新令牌
    let expires_at = chrono::Utc::now().naive_utc()
        + chrono::Duration::seconds(state.jwt_config.refresh_token_expires_in);
    AuthRepository::save_refresh_token(&state.pool, &user.id, &refresh_token, expires_at).await?;

    let response = AuthResponse {
        access_token,
        refresh_token,
        user: UserInfo {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            is_active: user.is_active,
        },
    };

    Ok((StatusCode::CREATED, Json(ApiResponse::success(response))))
}

/// 用户登录
pub async fn login(
    State(state): State<AppState>,
    Json(request): Json<LoginRequest>,
) -> AppResult<Json<ApiResponse<AuthResponse>>> {
    // 验证输入
    if request.username.is_empty() || request.password.is_empty() {
        return Err(AppError::BadRequest("用户名和密码不能为空".to_string()));
    }

    // 获取用户
    let user = AuthRepository::get_user_by_username_for_auth(&state.pool, &request.username)
        .await?
        .ok_or_else(|| AppError::Unauthorized("用户名或密码错误".to_string()))?;

    // 检查用户是否激活
    if !user.is_active {
        return Err(AppError::Unauthorized("用户已被禁用".to_string()));
    }

    // 验证密码
    let password_hash = user
        .password
        .as_ref()
        .ok_or_else(|| AppError::InternalError("用户密码数据异常".to_string()))?;

    let is_valid = bcrypt::verify(&request.password, password_hash)
        .map_err(|e| AppError::InternalError(format!("密码验证失败: {}", e)))?;

    if !is_valid {
        return Err(AppError::Unauthorized("用户名或密码错误".to_string()));
    }

    // 生成令牌
    let access_token = JwtUtil::generate_access_token(&user.id, &user.username, &state.jwt_config)?;
    let refresh_token =
        JwtUtil::generate_refresh_token(&user.id, &user.username, &state.jwt_config)?;

    // 保存刷新令牌
    let expires_at = chrono::Utc::now().naive_utc()
        + chrono::Duration::seconds(state.jwt_config.refresh_token_expires_in);
    AuthRepository::save_refresh_token(&state.pool, &user.id, &refresh_token, expires_at).await?;

    let response = AuthResponse {
        access_token,
        refresh_token,
        user: UserInfo {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            is_active: user.is_active,
        },
    };

    Ok(Json(ApiResponse::success(response)))
}

/// 刷新令牌
pub async fn refresh_token(
    State(state): State<AppState>,
    Json(request): Json<RefreshTokenRequest>,
) -> AppResult<Json<ApiResponse<AuthResponse>>> {
    // 验证刷新令牌格式
    let _claims = JwtUtil::verify_refresh_token(&request.refresh_token, &state.jwt_config)?;

    // 验证刷新令牌是否在数据库中
    let db_token = AuthRepository::verify_refresh_token(&state.pool, &request.refresh_token)
        .await?
        .ok_or_else(|| AppError::Unauthorized("刷新令牌无效或已过期".to_string()))?;

    // 获取用户信息
    let user = AuthRepository::get_user_info_by_id(&state.pool, &db_token.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("用户不存在".to_string()))?;

    // 检查用户是否激活
    if !user.is_active {
        return Err(AppError::Unauthorized("用户已被禁用".to_string()));
    }

    // 生成新的令牌
    let new_access_token =
        JwtUtil::generate_access_token(&user.id, &user.username, &state.jwt_config)?;
    let new_refresh_token =
        JwtUtil::generate_refresh_token(&user.id, &user.username, &state.jwt_config)?;

    // 删除旧的刷新令牌
    AuthRepository::delete_refresh_token(&state.pool, &request.refresh_token).await?;

    // 保存新的刷新令牌
    let expires_at = chrono::Utc::now().naive_utc()
        + chrono::Duration::seconds(state.jwt_config.refresh_token_expires_in);
    AuthRepository::save_refresh_token(&state.pool, &user.id, &new_refresh_token, expires_at)
        .await?;

    let response = AuthResponse {
        access_token: new_access_token,
        refresh_token: new_refresh_token,
        user,
    };

    Ok(Json(ApiResponse::success(response)))
}

/// 退出登录
pub async fn logout(
    State(state): State<AppState>,
    Json(request): Json<RefreshTokenRequest>,
) -> AppResult<Json<ApiResponse<()>>> {
    // 删除刷新令牌
    AuthRepository::delete_refresh_token(&state.pool, &request.refresh_token).await?;

    Ok(Json(ApiResponse::success(())))
}

use crate::common::app_state::AppState;
use crate::common::error::{AppError, AppResult};
use crate::common::jwt::JwtUtil;
use crate::common::middleware::get_current_user;
use crate::common::response::ApiResponse;
use crate::modules::auth::models::{AuthResponse, LoginRequest, RegisterRequest, UserInfo};
use crate::modules::auth::repository::AuthRepository;
use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use cookie::{time::Duration as CookieDuration, Cookie, SameSite};

const REFRESH_COOKIE_NAME: &str = "refresh_token";
const ACCESS_COOKIE_NAME: &str = "access_token";

fn build_refresh_cookie(token: String, max_age_seconds: i64) -> Cookie<'static> {
    // 本地开发：Secure=false；生产环境建议通过 env 控制为 true
    Cookie::build((REFRESH_COOKIE_NAME, token))
        .http_only(true)
        .secure(false)
        .same_site(SameSite::Lax)
        .path("/api/auth")
        .max_age(CookieDuration::seconds(max_age_seconds))
        .build()
}

fn clear_refresh_cookie() -> Cookie<'static> {
    Cookie::build((REFRESH_COOKIE_NAME, ""))
        .http_only(true)
        .secure(false)
        .same_site(SameSite::Lax)
        .path("/api/auth")
        .max_age(CookieDuration::seconds(0))
        .build()
}

fn build_access_cookie(token: String, max_age_seconds: i64) -> Cookie<'static> {
    Cookie::build((ACCESS_COOKIE_NAME, token))
        .http_only(true)
        .secure(false)
        .same_site(SameSite::Lax)
        .path("/api")
        .max_age(CookieDuration::seconds(max_age_seconds))
        .build()
}

fn clear_access_cookie() -> Cookie<'static> {
    Cookie::build((ACCESS_COOKIE_NAME, ""))
        .http_only(true)
        .secure(false)
        .same_site(SameSite::Lax)
        .path("/api")
        .max_age(CookieDuration::seconds(0))
        .build()
}

fn extract_refresh_token_from_cookie(headers: &axum::http::HeaderMap) -> AppResult<String> {
    let cookie_header = headers
        .get(axum::http::header::COOKIE)
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("缺少刷新令牌".to_string()))?;

    for c in Cookie::split_parse(cookie_header) {
        let c = c.map_err(|_| AppError::Unauthorized("无效的 Cookie".to_string()))?;
        if c.name() == REFRESH_COOKIE_NAME {
            let value = c.value().to_string();
            if !value.is_empty() {
                return Ok(value);
            }
        }
    }

    Err(AppError::Unauthorized("缺少刷新令牌".to_string()))
}

/// 用户注册
pub async fn register(
    State(state): State<AppState>,
    Json(request): Json<RegisterRequest>,
) -> AppResult<impl IntoResponse> {
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
    let user_id = state
        .generate_id()
        .map_err(|e| AppError::InternalError(format!("生成用户ID失败: {}", e)))?;
    let user = AuthRepository::create_user(
        &state.pool,
        user_id,
        &request.username,
        &password_hash,
        &request.full_name,
        &request.email,
        request.phone.as_deref(),
    )
    .await?;

    // 生成令牌
    let access_token =
        JwtUtil::generate_access_token(user.id.into(), &user.username, &state.jwt_config)?;
    let refresh_token =
        JwtUtil::generate_refresh_token(user.id.into(), &user.username, &state.jwt_config)?;

    // 保存刷新令牌
    let expires_at = chrono::Utc::now().naive_utc()
        + chrono::Duration::seconds(state.jwt_config.refresh_token_expires_in);
    let refresh_token_id = state
        .generate_id()
        .map_err(|e| AppError::InternalError(format!("生成刷新令牌ID失败: {}", e)))?;
    AuthRepository::save_refresh_token(
        &state.pool,
        refresh_token_id,
        user.id.into(),
        &refresh_token,
        expires_at,
    )
    .await?;

    let response = AuthResponse {
        user: UserInfo {
            id: user.id.into(),
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            is_active: user.is_active,
        },
    };

    let refresh_cookie =
        build_refresh_cookie(refresh_token, state.jwt_config.refresh_token_expires_in);
    let access_cookie = build_access_cookie(access_token, state.jwt_config.access_token_expires_in);

    Ok((
        StatusCode::CREATED,
        [
            (axum::http::header::SET_COOKIE, refresh_cookie.to_string()),
            (axum::http::header::SET_COOKIE, access_cookie.to_string()),
        ],
        Json(ApiResponse::success(response)),
    ))
}

/// 用户登录
pub async fn login(
    State(state): State<AppState>,
    Json(request): Json<LoginRequest>,
) -> AppResult<impl IntoResponse> {
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
    let access_token =
        JwtUtil::generate_access_token(user.id.into(), &user.username, &state.jwt_config)?;
    let refresh_token =
        JwtUtil::generate_refresh_token(user.id.into(), &user.username, &state.jwt_config)?;

    // 保存刷新令牌
    let expires_at = chrono::Utc::now().naive_utc()
        + chrono::Duration::seconds(state.jwt_config.refresh_token_expires_in);
    let refresh_token_id = state
        .generate_id()
        .map_err(|e| AppError::InternalError(format!("生成刷新令牌ID失败: {}", e)))?;
    AuthRepository::save_refresh_token(
        &state.pool,
        refresh_token_id,
        user.id.into(),
        &refresh_token,
        expires_at,
    )
    .await?;

    let response = AuthResponse {
        user: UserInfo {
            id: user.id.into(),
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            is_active: user.is_active,
        },
    };

    let refresh_cookie =
        build_refresh_cookie(refresh_token, state.jwt_config.refresh_token_expires_in);
    let access_cookie = build_access_cookie(access_token, state.jwt_config.access_token_expires_in);

    Ok((
        [
            (axum::http::header::SET_COOKIE, refresh_cookie.to_string()),
            (axum::http::header::SET_COOKIE, access_cookie.to_string()),
        ],
        Json(ApiResponse::success(response)),
    ))
}

/// 刷新令牌
pub async fn refresh_token(
    State(state): State<AppState>,
    request: axum::extract::Request,
) -> AppResult<impl IntoResponse> {
    let refresh_token = extract_refresh_token_from_cookie(request.headers())?;

    // 验证刷新令牌格式
    let _claims = JwtUtil::verify_refresh_token(&refresh_token, &state.jwt_config)?;

    // 验证刷新令牌是否在数据库中
    let db_token = AuthRepository::verify_refresh_token(&state.pool, &refresh_token)
        .await?
        .ok_or_else(|| AppError::Unauthorized("刷新令牌无效或已过期".to_string()))?;

    // 获取用户信息
    let user = AuthRepository::get_user_info_by_id(&state.pool, db_token.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("用户不存在".to_string()))?;

    // 检查用户是否激活
    if !user.is_active {
        return Err(AppError::Unauthorized("用户已被禁用".to_string()));
    }

    // 生成新的令牌
    let new_access_token =
        JwtUtil::generate_access_token(user.id.into(), &user.username, &state.jwt_config)?;
    let new_refresh_token =
        JwtUtil::generate_refresh_token(user.id.into(), &user.username, &state.jwt_config)?;

    // 删除旧的刷新令牌
    AuthRepository::delete_refresh_token(&state.pool, &refresh_token).await?;

    // 保存新的刷新令牌
    let expires_at = chrono::Utc::now().naive_utc()
        + chrono::Duration::seconds(state.jwt_config.refresh_token_expires_in);
    let refresh_token_id = state
        .generate_id()
        .map_err(|e| AppError::InternalError(format!("生成刷新令牌ID失败: {}", e)))?;
    AuthRepository::save_refresh_token(
        &state.pool,
        refresh_token_id,
        user.id.into(),
        &new_refresh_token,
        expires_at,
    )
    .await?;

    let response = AuthResponse {
        user,
    };

    let refresh_cookie =
        build_refresh_cookie(new_refresh_token, state.jwt_config.refresh_token_expires_in);
    let access_cookie = build_access_cookie(new_access_token, state.jwt_config.access_token_expires_in);

    Ok((
        [
            (axum::http::header::SET_COOKIE, refresh_cookie.to_string()),
            (axum::http::header::SET_COOKIE, access_cookie.to_string()),
        ],
        Json(ApiResponse::success(response)),
    ))
}

/// 退出登录
pub async fn logout(
    State(state): State<AppState>,
    request: axum::extract::Request,
) -> AppResult<impl IntoResponse> {
    // 有 cookie 就删 DB 记录；没有也允许登出（幂等）
    if let Ok(refresh_token) = extract_refresh_token_from_cookie(request.headers()) {
        let _ = AuthRepository::delete_refresh_token(&state.pool, &refresh_token).await;
    }

    let refresh_cookie = clear_refresh_cookie();
    let access_cookie = clear_access_cookie();

    Ok((
        [
            (axum::http::header::SET_COOKIE, refresh_cookie.to_string()),
            (axum::http::header::SET_COOKIE, access_cookie.to_string()),
        ],
        Json(ApiResponse::success(())),
    ))
}

/// 会话检查（纯 cookie 鉴权下用于前端判断是否仍登录）
pub async fn session(
    State(state): State<AppState>,
    request: axum::extract::Request,
) -> AppResult<Json<ApiResponse<AuthResponse>>> {
    // 通过鉴权中间件解析出来的 claims 获取当前用户
    let claims = get_current_user(&request)?;

    let user = AuthRepository::get_user_info_by_id(&state.pool, claims.sub)
        .await?
        .ok_or_else(|| AppError::NotFound("用户不存在".to_string()))?;

    if !user.is_active {
        return Err(AppError::Unauthorized("用户已被禁用".to_string()));
    }

    Ok(Json(ApiResponse::success(AuthResponse { user })))
}

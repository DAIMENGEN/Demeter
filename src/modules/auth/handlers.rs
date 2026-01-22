use crate::common::app_state::AppState;
use crate::common::error::{AppError, AppResult};
use crate::common::jwt::JwtUtil;
use crate::common::middleware::get_current_user;
use crate::common::response::ApiResponse;
use crate::modules::auth::models::{AuthResponse, LoginRequest, RegisterRequest};
use crate::modules::auth::repository::AuthRepository;
use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use cookie::{time::Duration as CookieDuration, Cookie, SameSite};

const REFRESH_COOKIE_NAME: &str = "refresh_token";
const ACCESS_COOKIE_NAME: &str = "access_token";
const COOKIE_PATH: &str = "/api";

fn build_auth_cookie(name: &'static str, value: String, max_age_seconds: i64) -> Cookie<'static> {
    Cookie::build((name, value))
        .http_only(true)
        .secure(false)
        .same_site(SameSite::Lax)
        .path(COOKIE_PATH)
        .max_age(CookieDuration::seconds(max_age_seconds))
        .build()
}

fn clear_auth_cookie(name: &'static str) -> Cookie<'static> {
    build_auth_cookie(name, "".to_string(), 0)
}

fn build_refresh_cookie(token: String, max_age_seconds: i64) -> Cookie<'static> {
    build_auth_cookie(REFRESH_COOKIE_NAME, token, max_age_seconds)
}

fn clear_refresh_cookie() -> Cookie<'static> {
    clear_auth_cookie(REFRESH_COOKIE_NAME)
}

fn build_access_cookie(token: String, max_age_seconds: i64) -> Cookie<'static> {
    build_auth_cookie(ACCESS_COOKIE_NAME, token, max_age_seconds)
}

fn clear_access_cookie() -> Cookie<'static> {
    clear_auth_cookie(ACCESS_COOKIE_NAME)
}

fn extract_refresh_token_from_cookie(headers: &axum::http::HeaderMap) -> AppResult<String> {
    let cookie_header = headers
        .get(axum::http::header::COOKIE)
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing refresh token".to_string()))?;

    for c in Cookie::split_parse(cookie_header) {
        let c = c.map_err(|_| AppError::Unauthorized("Invalid Cookie".to_string()))?;
        if c.name() == REFRESH_COOKIE_NAME {
            let value = c.value().to_string();
            if !value.is_empty() {
                return Ok(value);
            }
        }
    }

    Err(AppError::Unauthorized("Missing refresh token".to_string()))
}

fn auth_set_cookie_headers(
    state: &AppState,
    access_token: String,
    refresh_token: String,
) -> axum::http::HeaderMap {
    use axum::http::{header::SET_COOKIE, HeaderValue};
    let refresh_cookie =
        build_refresh_cookie(refresh_token, state.jwt_config.refresh_token_expires_in);
    let access_cookie = build_access_cookie(access_token, state.jwt_config.access_token_expires_in);
    let mut headers = axum::http::HeaderMap::new();
    headers.append(
        SET_COOKIE,
        HeaderValue::from_str(&refresh_cookie.to_string())
            .expect("valid refresh Set-Cookie header value"),
    );
    headers.append(
        SET_COOKIE,
        HeaderValue::from_str(&access_cookie.to_string())
            .expect("valid access Set-Cookie header value"),
    );
    headers
}

async fn persist_refresh_token(
    state: &AppState,
    user_id: i64,
    refresh_token: &str,
) -> AppResult<()> {
    let expires_at = chrono::Utc::now().naive_utc()
        + chrono::Duration::seconds(state.jwt_config.refresh_token_expires_in);
    let refresh_token_id = state.generate_id().map_err(|e| {
        AppError::InternalError(format!("Failed to generate refresh token ID: {}", e))
    })?;

    AuthRepository::save_refresh_token(
        &state.pool,
        refresh_token_id,
        user_id,
        refresh_token,
        expires_at,
    )
    .await?;

    Ok(())
}

pub async fn register(
    State(state): State<AppState>,
    Json(request): Json<RegisterRequest>,
) -> AppResult<impl IntoResponse> {
    if request.username.is_empty() || request.password.is_empty() {
        return Err(AppError::BadRequest(
            "Username and password cannot be empty".to_string(),
        ));
    }

    if request.password.len() < 6 {
        return Err(AppError::BadRequest(
            "Password must be at least 6 characters".to_string(),
        ));
    }

    if AuthRepository::check_username_exists(&state.pool, &request.username).await? {
        return Err(AppError::BadRequest("Username already exists".to_string()));
    }

    if AuthRepository::check_email_exists(&state.pool, &request.email).await? {
        return Err(AppError::BadRequest(
            "Email is already registered".to_string(),
        ));
    }

    let password_hash = bcrypt::hash(&request.password, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::InternalError(format!("Failed to hash password: {}", e)))?;

    let user_id = state
        .generate_id()
        .map_err(|e| AppError::InternalError(format!("Failed to generate user ID: {}", e)))?;
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

    let access_token =
        JwtUtil::generate_access_token(user.id.into(), &user.username, &state.jwt_config)?;
    let refresh_token =
        JwtUtil::generate_refresh_token(user.id.into(), &user.username, &state.jwt_config)?;
    persist_refresh_token(&state, user.id.into(), &refresh_token).await?;

    let response = AuthResponse { user: user.into() };

    let headers = auth_set_cookie_headers(&state, access_token, refresh_token);

    Ok((
        StatusCode::CREATED,
        headers,
        Json(ApiResponse::success(response)),
    ))
}

pub async fn login(
    State(state): State<AppState>,
    Json(request): Json<LoginRequest>,
) -> AppResult<impl IntoResponse> {
    if request.username.is_empty() || request.password.is_empty() {
        return Err(AppError::BadRequest(
            "Username and password cannot be empty".to_string(),
        ));
    }

    let user = AuthRepository::get_user_by_username_for_auth(&state.pool, &request.username)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Incorrect username or password".to_string()))?;

    if !user.is_active {
        return Err(AppError::Unauthorized("User has been disabled".to_string()));
    }

    let password_hash = user
        .password
        .as_ref()
        .ok_or_else(|| AppError::InternalError("User password data error".to_string()))?;

    let is_valid = bcrypt::verify(&request.password, password_hash)
        .map_err(|e| AppError::InternalError(format!("Password verification failed: {}", e)))?;

    if !is_valid {
        return Err(AppError::Unauthorized(
            "Incorrect username or password".to_string(),
        ));
    }

    let access_token =
        JwtUtil::generate_access_token(user.id.into(), &user.username, &state.jwt_config)?;
    let refresh_token =
        JwtUtil::generate_refresh_token(user.id.into(), &user.username, &state.jwt_config)?;
    persist_refresh_token(&state, user.id.into(), &refresh_token).await?;

    let response = AuthResponse { user: user.into() };

    let headers = auth_set_cookie_headers(&state, access_token, refresh_token);

    Ok((headers, Json(ApiResponse::success(response))))
}

pub async fn refresh_token(
    State(state): State<AppState>,
    request: axum::extract::Request,
) -> AppResult<impl IntoResponse> {
    let refresh_token = extract_refresh_token_from_cookie(request.headers())?;

    let _claims = JwtUtil::verify_refresh_token(&refresh_token, &state.jwt_config)?;

    let db_token = AuthRepository::verify_refresh_token(&state.pool, &refresh_token)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid or expired refresh token".to_string()))?;

    tracing::debug!(
        id = db_token.id,
        user_id = db_token.user_id,
        token = %db_token.token,
        expires_at = %db_token.expires_at,
        created_at = %db_token.created_at,
        "refresh_token: db_token info, refresh event occurred"
    );

    let user = AuthRepository::get_user_info_by_id(&state.pool, db_token.user_id)
        .await?
        .ok_or_else(|| AppError::NotFound("User does not exist".to_string()))?;

    if !user.is_active {
        return Err(AppError::Unauthorized("User has been disabled".to_string()));
    }

    let new_access_token =
        JwtUtil::generate_access_token(user.id.into(), &user.username, &state.jwt_config)?;
    let new_refresh_token =
        JwtUtil::generate_refresh_token(user.id.into(), &user.username, &state.jwt_config)?;

    AuthRepository::delete_refresh_token(&state.pool, &refresh_token).await?;

    persist_refresh_token(&state, user.id.into(), &new_refresh_token).await?;

    let response = AuthResponse { user };
    let headers = auth_set_cookie_headers(&state, new_access_token, new_refresh_token);

    Ok((headers, Json(ApiResponse::success(response))))
}

pub async fn logout(
    State(state): State<AppState>,
    request: axum::extract::Request,
) -> AppResult<impl IntoResponse> {
    match extract_refresh_token_from_cookie(request.headers()) {
        Ok(refresh_token) => {
            let _ = AuthRepository::delete_refresh_token(&state.pool, &refresh_token).await;
        }
        Err(_) => {
            tracing::debug!(
                has_cookie_header = request.headers().contains_key(axum::http::header::COOKIE),
                "logout request missing refresh_token cookie"
            );
        }
    }

    let refresh_cookie = clear_refresh_cookie();
    let access_cookie = clear_access_cookie();

    let mut headers = axum::http::HeaderMap::new();
    headers.append(
        axum::http::header::SET_COOKIE,
        axum::http::HeaderValue::from_str(&refresh_cookie.to_string())
            .expect("valid refresh Set-Cookie header value"),
    );
    headers.append(
        axum::http::header::SET_COOKIE,
        axum::http::HeaderValue::from_str(&access_cookie.to_string())
            .expect("valid access Set-Cookie header value"),
    );

    Ok((headers, Json(ApiResponse::success(()))))
}

pub async fn session(
    State(state): State<AppState>,
    request: axum::extract::Request,
) -> AppResult<Json<ApiResponse<AuthResponse>>> {
    let claims = get_current_user(&request)?;

    let user = AuthRepository::get_user_info_by_id(&state.pool, claims.sub)
        .await?
        .ok_or_else(|| AppError::NotFound("User does not exist".to_string()))?;

    if !user.is_active {
        return Err(AppError::Unauthorized("User has been disabled".to_string()));
    }

    Ok(Json(ApiResponse::success(AuthResponse { user })))
}

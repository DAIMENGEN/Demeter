use crate::common::error::AppError;
use crate::common::jwt::{Claims, JwtUtil};
use crate::config::JwtConfig;
use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use cookie::Cookie;

const ACCESS_COOKIE_NAME: &str = "access_token";

fn extract_access_token_from_cookie(headers: &axum::http::HeaderMap) -> Option<String> {
    let cookie_header = headers
        .get(axum::http::header::COOKIE)
        .and_then(|v| v.to_str().ok())?;

    for c in Cookie::split_parse(cookie_header) {
        let c = c.ok()?;
        if c.name() == ACCESS_COOKIE_NAME {
            let value = c.value().to_string();
            if !value.is_empty() {
                return Some(value);
            }
        }
    }

    None
}

pub async fn jwt_auth_middleware(
    State(jwt_config): State<JwtConfig>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let token = if let Some(token) = extract_access_token_from_cookie(request.headers()) {
        token
    } else {
        let auth_header = request
            .headers()
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .ok_or_else(|| AppError::Unauthorized("Missing authentication token".to_string()))?;

        if !auth_header.starts_with("Bearer ") {
            return Err(AppError::Unauthorized(
                "Invalid authentication token format".to_string(),
            ));
        }

        auth_header[7..].to_string()
    };

    let claims = JwtUtil::verify_access_token(&token, &jwt_config)?;

    request.extensions_mut().insert(claims);

    Ok(next.run(request).await)
}

pub fn get_current_user(request: &Request) -> Result<Claims, AppError> {
    request
        .extensions()
        .get::<Claims>()
        .cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".to_string()))
}

const ADMIN_USERNAME: &str = "admin";

pub async fn admin_auth_middleware(
    request: Request,
    next: Next,
) -> Result<Response, AppError> {
    let claims = request
        .extensions()
        .get::<Claims>()
        .cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".to_string()))?;

    if claims.username != ADMIN_USERNAME {
        return Err(AppError::Forbidden(
            "Admin access required".to_string(),
        ));
    }

    Ok(next.run(request).await)
}

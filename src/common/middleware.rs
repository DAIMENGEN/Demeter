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

/// JWT 认证中间件
pub async fn jwt_auth_middleware(
    State(jwt_config): State<JwtConfig>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    // 1) 优先从 Cookie 读取 access token（HttpOnly，JS 不可见）
    // 2) 回退到 Authorization: Bearer ...（兼容现有实现/调试）
    let token = if let Some(token) = extract_access_token_from_cookie(request.headers()) {
        token
    } else {
        let auth_header = request
            .headers()
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .ok_or_else(|| AppError::Unauthorized("缺少认证令牌".to_string()))?;

        if !auth_header.starts_with("Bearer ") {
            return Err(AppError::Unauthorized("无效的认证令牌格式".to_string()));
        }

        auth_header[7..].to_string()
    };

    // 验证令牌
    let claims = JwtUtil::verify_access_token(&token, &jwt_config)?;

    // 将用户信息存储到请求扩展中，以便后续处理器使用
    request.extensions_mut().insert(claims);

    Ok(next.run(request).await)
}

/// 从请求中提取当前用户信息
pub fn get_current_user(request: &Request) -> Result<Claims, AppError> {
    request
        .extensions()
        .get::<Claims>()
        .cloned()
        .ok_or_else(|| AppError::Unauthorized("未认证".to_string()))
}

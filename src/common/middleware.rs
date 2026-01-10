use crate::common::error::AppError;
use crate::common::jwt::{Claims, JwtUtil};
use crate::config::JwtConfig;
use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};

/// JWT 认证中间件
pub async fn jwt_auth_middleware(
    State(jwt_config): State<JwtConfig>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    // 从请求头中获取 Authorization
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("缺少认证令牌".to_string()))?;

    // 验证 Bearer 前缀
    if !auth_header.starts_with("Bearer ") {
        return Err(AppError::Unauthorized("无效的认证令牌格式".to_string()));
    }

    // 提取令牌
    let token = &auth_header[7..];

    // 验证令牌
    let claims = JwtUtil::verify_access_token(token, &jwt_config)?;

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

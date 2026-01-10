use crate::modules::auth::handlers::{login, logout, refresh_token, register, AppState};
use axum::{routing::post, Router};

/// 创建认证路由
pub fn auth_routes(state: AppState) -> Router {
    Router::new()
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/auth/refresh", post(refresh_token))
        .route("/auth/logout", post(logout))
        .with_state(state)
}

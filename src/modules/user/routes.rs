use crate::modules::user::handlers;
use axum::{
    routing::{delete, get, post, put},
    Router,
};
use sqlx::PgPool;

/// 用户路由配置
pub fn user_routes() -> Router<PgPool> {
    Router::new()
        .route("/api/users", get(handlers::get_user_list))
        .route("/api/users/all", get(handlers::get_all_users))
        .route("/api/users", post(handlers::create_user))
        .route("/api/users/{id}", get(handlers::get_user_by_id))
        .route("/api/users/{id}", put(handlers::update_user))
        .route("/api/users/{id}", delete(handlers::delete_user))
        .route(
            "/api/users/username/{username}",
            get(handlers::get_user_by_username),
        )
        .route(
            "/api/users/batch-delete",
            post(handlers::batch_delete_users),
        )
        .route("/api/users/{id}/status", put(handlers::toggle_user_status))
}

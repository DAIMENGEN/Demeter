use crate::modules::user::handlers;
use axum::{
    routing::{delete, get, post, put},
    Router,
};
use sqlx::PgPool;

/// 用户路由配置
pub fn user_routes() -> Router<PgPool> {
    Router::new()
        .route("/users", get(handlers::get_user_list))
        .route("/users/all", get(handlers::get_all_users))
        .route("/users", post(handlers::create_user))
        .route("/users/{id}", get(handlers::get_user_by_id))
        .route("/users/{id}", put(handlers::update_user))
        .route("/users/{id}", delete(handlers::delete_user))
        .route(
            "/users/username/{username}",
            get(handlers::get_user_by_username),
        )
        .route(
            "/users/batch-delete",
            post(handlers::batch_delete_users),
        )
        .route("/users/{id}/status", put(handlers::toggle_user_status))
}

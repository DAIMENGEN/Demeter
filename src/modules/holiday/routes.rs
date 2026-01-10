use crate::modules::holiday::handlers;
use axum::{
    routing::{delete, get, post, put},
    Router,
};
use sqlx::PgPool;

/// 假期路由配置
pub fn holiday_routes() -> Router<PgPool> {
    Router::new()
        .route("/holidays", get(handlers::get_holiday_list))
        .route("/holidays/all", get(handlers::get_all_holidays))
        .route("/holidays", post(handlers::create_holiday))
        .route("/holidays/{id}", get(handlers::get_holiday_by_id))
        .route("/holidays/{id}", put(handlers::update_holiday))
        .route("/holidays/{id}", delete(handlers::delete_holiday))
        .route(
            "/holidays/batch-delete",
            post(handlers::batch_delete_holidays),
        )
}


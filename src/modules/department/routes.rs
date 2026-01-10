use crate::modules::department::handlers;
use axum::{
    routing::{delete, get, post, put},
    Router,
};
use sqlx::PgPool;

/// 部门路由配置
pub fn department_routes() -> Router<PgPool> {
    Router::new()
        .route("/departments", get(handlers::get_department_list))
        .route("/departments/all", get(handlers::get_all_departments))
        .route("/departments", post(handlers::create_department))
        .route("/departments/{id}", get(handlers::get_department_by_id))
        .route("/departments/{id}", put(handlers::update_department))
        .route("/departments/{id}", delete(handlers::delete_department))
        .route(
            "/departments/name/{department_name}",
            get(handlers::get_department_by_name),
        )
        .route(
            "/departments/batch-delete",
            post(handlers::batch_delete_departments),
        )
}


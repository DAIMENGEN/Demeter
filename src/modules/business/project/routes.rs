use crate::common::middleware::jwt_auth_middleware;
use crate::config::JwtConfig;
use crate::modules::business::project::handlers;
use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};
use sqlx::PgPool;

/// 项目路由配置
pub fn project_routes(jwt_config: JwtConfig) -> Router<PgPool> {
    Router::new()
        .route("/projects", get(handlers::get_project_list))
        .route("/projects/all", get(handlers::get_all_projects))
        .route("/projects", post(handlers::create_project))
        .route("/projects/{id}", get(handlers::get_project_by_id))
        .route("/projects/{id}", put(handlers::update_project))
        .route("/projects/{id}", delete(handlers::delete_project))
        .route(
            "/projects/name/{project_name}",
            get(handlers::get_project_by_name),
        )
        .route(
            "/projects/batch-delete",
            post(handlers::batch_delete_projects),
        )
        .layer(middleware::from_fn_with_state(
            jwt_config,
            jwt_auth_middleware,
        ))
}

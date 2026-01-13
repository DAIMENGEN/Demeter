use crate::common::middleware::jwt_auth_middleware;
use crate::config::JwtConfig;
use crate::modules::business::project::task::handlers;
use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};
use sqlx::PgPool;

/// 任务路由配置
pub fn task_routes(jwt_config: JwtConfig) -> Router<PgPool> {
    Router::new()
        // 任务属性配置路由
        .route(
            "/projects/{project_id}/task-attributes",
            get(handlers::get_attribute_configs),
        )
        .route(
            "/projects/{project_id}/task-attributes",
            post(handlers::create_attribute_config),
        )
        .route(
            "/projects/{project_id}/task-attributes/{config_id}",
            get(handlers::get_attribute_config_by_id),
        )
        .route(
            "/projects/{project_id}/task-attributes/{config_id}",
            put(handlers::update_attribute_config),
        )
        .route(
            "/projects/{project_id}/task-attributes/{config_id}",
            delete(handlers::delete_attribute_config),
        )
        .route(
            "/projects/{project_id}/task-attributes/batch-delete",
            post(handlers::batch_delete_attribute_configs),
        )
        // 任务路由
        .route(
            "/projects/{project_id}/tasks",
            get(handlers::get_task_list),
        )
        .route(
            "/projects/{project_id}/tasks/all",
            get(handlers::get_all_tasks),
        )
        .route(
            "/projects/{project_id}/tasks",
            post(handlers::create_task),
        )
        .route(
            "/projects/{project_id}/tasks/{task_id}",
            get(handlers::get_task_by_id),
        )
        .route(
            "/projects/{project_id}/tasks/{task_id}",
            put(handlers::update_task),
        )
        .route(
            "/projects/{project_id}/tasks/{task_id}",
            delete(handlers::delete_task),
        )
        .route(
            "/projects/{project_id}/tasks/batch-delete",
            post(handlers::batch_delete_tasks),
        )
        .layer(middleware::from_fn_with_state(
            jwt_config,
            jwt_auth_middleware,
        ))
}


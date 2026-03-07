use crate::common::app_state::AppState;
use crate::common::middleware::jwt_auth_middleware;
use crate::modules::business::project::permission::middleware::project_permission_middleware;
use crate::modules::business::project::task::handlers;
use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};

pub fn task_routes(state: AppState) -> Router {
    Router::new()
        .route(
            "/projects/{project_id}/task-attribute-configs",
            get(handlers::get_attribute_configs),
        )
        .route(
            "/projects/{project_id}/task-attribute-configs",
            post(handlers::create_attribute_config),
        )
        .route(
            "/projects/{project_id}/task-attribute-configs/{config_id}",
            get(handlers::get_attribute_config_by_id),
        )
        .route(
            "/projects/{project_id}/task-attribute-configs/{config_id}",
            put(handlers::update_attribute_config),
        )
        .route(
            "/projects/{project_id}/task-attribute-configs/{config_id}",
            delete(handlers::delete_attribute_config),
        )
        .route(
            "/projects/{project_id}/task-attribute-configs/batch-delete",
            post(handlers::batch_delete_attribute_configs),
        )
        .route(
            "/projects/{project_id}/task-attribute-configs/{config_id}/restore",
            post(handlers::restore_attribute_config),
        )
        .route(
            "/projects/{project_id}/task-attribute-configs/{config_id}/hard-delete",
            delete(handlers::hard_delete_attribute_config),
        )
        .route(
            "/projects/{project_id}/task-attribute-configs/batch-hard-delete",
            post(handlers::batch_hard_delete_attribute_configs),
        )
        // 任务路由
        .route("/projects/{project_id}/tasks", get(handlers::get_task_list))
        .route(
            "/projects/{project_id}/tasks/all",
            get(handlers::get_all_tasks),
        )
        .route("/projects/{project_id}/tasks", post(handlers::create_task))
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
            "/projects/{project_id}/tasks/batch-create",
            post(handlers::batch_create_tasks),
        )
        .route(
            "/projects/{project_id}/tasks/batch-delete",
            post(handlers::batch_delete_tasks),
        )
        // 项目权限中间件（需要 Claims 已注入）
        .layer(middleware::from_fn_with_state(
            state.pool.clone(),
            project_permission_middleware,
        ))
        // JWT 认证中间件
        .layer(middleware::from_fn_with_state(
            state.jwt_config.clone(),
            jwt_auth_middleware,
        ))
        .with_state(state)
}

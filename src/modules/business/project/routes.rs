use crate::common::app_state::AppState;
use crate::common::middleware::{jwt_auth_middleware, super_admin_auth_middleware};
use crate::modules::business::project::handlers;
use crate::modules::business::project::permission::middleware::project_permission_middleware;
use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};

pub fn project_routes(state: AppState) -> Router {
    // 需要项目权限检查的路由（含 project_id 的路由）
    let project_scoped = Router::new()
        .route("/projects/{id}", get(handlers::get_project_by_id))
        .route("/projects/{id}", put(handlers::update_project))
        .route("/projects/{id}", delete(handlers::delete_project))
        .route(
            "/projects/{id}/visit",
            post(handlers::record_project_visit),
        )
        .layer(middleware::from_fn_with_state(
            state.pool.clone(),
            project_permission_middleware,
        ));

    // 仅 super_admin 可用的路由（全局管理：全量列表 / 批量删除）
    let super_admin_routes = Router::new()
        .route("/projects", get(handlers::get_project_list))
        .route("/projects/all", get(handlers::get_all_projects))
        .route(
            "/projects/batch-delete",
            post(handlers::batch_delete_projects),
        )
        .layer(middleware::from_fn(super_admin_auth_middleware));

    // 所有认证用户可访问的路由
    let project_general = Router::new()
        .route("/projects/reorder", post(handlers::reorder_projects))
        .route("/projects/my", get(handlers::get_my_project_list))
        .route("/projects/my/all", get(handlers::get_my_all_projects))
        .route(
            "/projects/recently-visited",
            get(handlers::get_recently_visited_projects),
        )
        .route(
            "/projects/accessible",
            get(handlers::get_accessible_projects),
        )
        .route("/projects", post(handlers::create_project))
        .route(
            "/projects/name/{project_name}",
            get(handlers::get_project_by_name),
        );

    Router::new()
        .merge(project_scoped)
        .merge(super_admin_routes)
        .merge(project_general)
        .layer(middleware::from_fn_with_state(
            state.jwt_config.clone(),
            jwt_auth_middleware,
        ))
        .with_state(state)
}

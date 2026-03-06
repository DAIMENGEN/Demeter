use crate::common::app_state::AppState;
use crate::common::middleware::jwt_auth_middleware;
use crate::modules::business::project::permission::handlers;
use crate::modules::business::project::permission::middleware::project_permission_middleware;
use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};

pub fn permission_routes(state: AppState) -> Router {
    Router::new()
        // 成员管理
        .route(
            "/projects/{project_id}/members",
            get(handlers::get_members),
        )
        .route(
            "/projects/{project_id}/members",
            post(handlers::add_members),
        )
        .route(
            "/projects/{project_id}/members/{user_id}",
            put(handlers::update_member_role),
        )
        .route(
            "/projects/{project_id}/members/{user_id}",
            delete(handlers::remove_member),
        )
        // 团队角色管理
        .route(
            "/projects/{project_id}/team-roles",
            get(handlers::get_team_roles),
        )
        .route(
            "/projects/{project_id}/team-roles",
            post(handlers::add_team_roles),
        )
        .route(
            "/projects/{project_id}/team-roles/{team_id}",
            put(handlers::update_team_role),
        )
        .route(
            "/projects/{project_id}/team-roles/{team_id}",
            delete(handlers::remove_team_role),
        )
        // 部门角色管理
        .route(
            "/projects/{project_id}/department-roles",
            get(handlers::get_department_roles),
        )
        .route(
            "/projects/{project_id}/department-roles",
            post(handlers::add_department_roles),
        )
        .route(
            "/projects/{project_id}/department-roles/{department_id}",
            put(handlers::update_department_role),
        )
        .route(
            "/projects/{project_id}/department-roles/{department_id}",
            delete(handlers::remove_department_role),
        )
        // 当前用户权限查询
        .route(
            "/projects/{project_id}/my-permissions",
            get(handlers::get_my_permissions),
        )
        // 先经过 项目权限中间件（需要 Claims 已注入）
        .layer(middleware::from_fn_with_state(
            state.pool.clone(),
            project_permission_middleware,
        ))
        // 再经过 JWT 认证中间件
        .layer(middleware::from_fn_with_state(
            state.jwt_config.clone(),
            jwt_auth_middleware,
        ))
        .with_state(state)
}

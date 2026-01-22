use crate::common::app_state::AppState;
use crate::common::middleware::jwt_auth_middleware;
use crate::modules::business::project::handlers;
use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};

pub fn project_routes(state: AppState) -> Router {
    Router::new()
        .route("/projects", get(handlers::get_project_list))
        .route("/projects/all", get(handlers::get_all_projects))
        .route("/projects/my", get(handlers::get_my_project_list))
        .route("/projects/my/all", get(handlers::get_my_all_projects))
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
            state.jwt_config.clone(),
            jwt_auth_middleware,
        ))
        .with_state(state)
}

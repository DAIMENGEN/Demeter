use crate::common::app_state::AppState;
use crate::common::middleware::jwt_auth_middleware;
use crate::modules::organization::department::handlers;
use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};

pub fn department_routes(state: AppState) -> Router {
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
        .layer(middleware::from_fn_with_state(
            state.jwt_config.clone(),
            jwt_auth_middleware,
        ))
        .with_state(state)
}

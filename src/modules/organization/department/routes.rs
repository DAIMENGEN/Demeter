use crate::common::app_state::AppState;
use crate::common::middleware::{admin_auth_middleware, jwt_auth_middleware};
use crate::modules::organization::department::handlers;
use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};

pub fn department_routes(state: AppState) -> Router {
    let auth_layer = middleware::from_fn_with_state(
        state.jwt_config.clone(),
        jwt_auth_middleware,
    );

    // Read routes - accessible to all authenticated users
    let read_routes = Router::new()
        .route("/departments", get(handlers::get_department_list))
        .route("/departments/all", get(handlers::get_all_departments))
        .route("/departments/{id}", get(handlers::get_department_by_id))
        .route(
            "/departments/name/{department_name}",
            get(handlers::get_department_by_name),
        );

    // Write routes - admin only
    let write_routes = Router::new()
        .route("/departments", post(handlers::create_department))
        .route("/departments/{id}", put(handlers::update_department))
        .route("/departments/{id}", delete(handlers::delete_department))
        .route(
            "/departments/batch-delete",
            post(handlers::batch_delete_departments),
        )
        .layer(middleware::from_fn(admin_auth_middleware));

    read_routes
        .merge(write_routes)
        .layer(auth_layer)
        .with_state(state)
}

use crate::common::app_state::AppState;
use crate::common::middleware::{admin_auth_middleware, jwt_auth_middleware};
use crate::modules::holiday::handlers;
use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};

pub fn holiday_routes(state: AppState) -> Router {
    let auth_layer = middleware::from_fn_with_state(
        state.jwt_config.clone(),
        jwt_auth_middleware,
    );

    // Read routes - accessible to all authenticated users
    let read_routes = Router::new()
        .route("/holidays", get(handlers::get_holiday_list))
        .route("/holidays/all", get(handlers::get_all_holidays))
        .route("/holidays/{id}", get(handlers::get_holiday_by_id));

    // Write routes - admin only
    let write_routes = Router::new()
        .route("/holidays", post(handlers::create_holiday))
        .route("/holidays/{id}", put(handlers::update_holiday))
        .route("/holidays/{id}", delete(handlers::delete_holiday))
        .route(
            "/holidays/batch-delete",
            post(handlers::batch_delete_holidays),
        )
        .route(
            "/holidays/batch-create",
            post(handlers::batch_create_holidays),
        )
        .route(
            "/holidays/batch-update",
            post(handlers::batch_update_holidays),
        )
        .layer(middleware::from_fn(admin_auth_middleware));

    read_routes
        .merge(write_routes)
        .layer(auth_layer)
        .with_state(state)
}

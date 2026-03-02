use crate::common::app_state::AppState;
use crate::common::middleware::jwt_auth_middleware;
use crate::modules::holiday::handlers;
use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};

pub fn holiday_routes(state: AppState) -> Router {
    Router::new()
        .route("/holidays", get(handlers::get_holiday_list))
        .route("/holidays/all", get(handlers::get_all_holidays))
        .route("/holidays", post(handlers::create_holiday))
        .route("/holidays/{id}", get(handlers::get_holiday_by_id))
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
        .layer(middleware::from_fn_with_state(
            state.jwt_config.clone(),
            jwt_auth_middleware,
        ))
        .with_state(state)
}

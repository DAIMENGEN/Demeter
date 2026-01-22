use crate::common::app_state::AppState;
use crate::common::middleware::jwt_auth_middleware;
use crate::modules::user::handlers;
use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};

pub fn user_routes(state: AppState) -> Router {
    Router::new()
        .route("/users", get(handlers::get_user_list))
        .route("/users/all", get(handlers::get_all_users))
        .route("/users", post(handlers::create_user))
        .route("/users/{id}", get(handlers::get_user_by_id))
        .route("/users/{id}", put(handlers::update_user))
        .route("/users/{id}", delete(handlers::delete_user))
        .route(
            "/users/username/{username}",
            get(handlers::get_user_by_username),
        )
        .route("/users/batch-delete", post(handlers::batch_delete_users))
        .route("/users/{id}/status", put(handlers::toggle_user_status))
        .layer(middleware::from_fn_with_state(
            state.jwt_config.clone(),
            jwt_auth_middleware,
        ))
        .with_state(state)
}

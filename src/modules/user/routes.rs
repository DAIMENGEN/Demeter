use crate::common::app_state::AppState;
use crate::common::middleware::{admin_auth_middleware, jwt_auth_middleware};
use crate::modules::user::handlers;
use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};

pub fn user_routes(state: AppState) -> Router {
    // Read endpoints: any authenticated user
    let read_routes = Router::new()
        .route("/users", get(handlers::get_user_list))
        .route("/users/all", get(handlers::get_all_users))
        .route("/users/{id}", get(handlers::get_user_by_id))
        .route(
            "/users/username/{username}",
            get(handlers::get_user_by_username),
        )
        .route("/users/me", put(handlers::update_profile))
        .layer(middleware::from_fn_with_state(
            state.jwt_config.clone(),
            jwt_auth_middleware,
        ))
        .with_state(state.clone());

    // Write endpoints: admin only
    let admin_routes = Router::new()
        .route("/users", post(handlers::create_user))
        .route("/users/{id}", put(handlers::update_user))
        .route("/users/{id}", delete(handlers::delete_user))
        .route("/users/batch-delete", post(handlers::batch_delete_users))
        .route("/users/{id}/status", put(handlers::toggle_user_status))
        .route(
            "/users/{id}/reset-password",
            post(handlers::reset_password),
        )
        .layer(middleware::from_fn(admin_auth_middleware))
        .layer(middleware::from_fn_with_state(
            state.jwt_config.clone(),
            jwt_auth_middleware,
        ))
        .with_state(state);

    Router::new().merge(read_routes).merge(admin_routes)
}

use crate::common::app_state::AppState;
use crate::common::middleware::jwt_auth_middleware;
use crate::modules::auth::handlers::{login, logout, refresh_token, register, session};
use axum::{middleware, routing::get, routing::post, Router};

pub fn auth_routes(state: AppState) -> Router {
    Router::new()
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/auth/refresh", post(refresh_token))
        .route("/auth/logout", post(logout))
        .route(
            "/auth/session",
            get(session).route_layer(middleware::from_fn_with_state(
                state.jwt_config.clone(),
                jwt_auth_middleware,
            )),
        )
        .with_state(state)
}

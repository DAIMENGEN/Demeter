use crate::common::app_state::AppState;
use crate::common::middleware::jwt_auth_middleware;
use crate::modules::organization::team::handlers;
use axum::{
    middleware,
    routing::{delete, get, post, put},
    Router,
};

pub fn team_routes(state: AppState) -> Router {
    Router::new()
        .route("/teams", get(handlers::get_team_list))
        .route("/teams/all", get(handlers::get_all_teams))
        .route("/teams", post(handlers::create_team))
        .route("/teams/{id}", get(handlers::get_team_by_id))
        .route("/teams/{id}", put(handlers::update_team))
        .route("/teams/{id}", delete(handlers::delete_team))
        .route("/teams/name/{team_name}", get(handlers::get_team_by_name))
        .route("/teams/batch-delete", post(handlers::batch_delete_teams))
        .layer(middleware::from_fn_with_state(
            state.jwt_config.clone(),
            jwt_auth_middleware,
        ))
        .with_state(state)
}

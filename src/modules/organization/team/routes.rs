use crate::modules::organization::team::handlers;
use axum::{
    routing::{delete, get, post, put},
    Router,
};
use sqlx::PgPool;
/// 团队路由配置
pub fn team_routes() -> Router<PgPool> {
    Router::new()
        .route("/teams", get(handlers::get_team_list))
        .route("/teams/all", get(handlers::get_all_teams))
        .route("/teams", post(handlers::create_team))
        .route("/teams/{id}", get(handlers::get_team_by_id))
        .route("/teams/{id}", put(handlers::update_team))
        .route("/teams/{id}", delete(handlers::delete_team))
        .route(
            "/teams/name/{team_name}",
            get(handlers::get_team_by_name),
        )
        .route(
            "/teams/batch-delete",
            post(handlers::batch_delete_teams),
        )
}

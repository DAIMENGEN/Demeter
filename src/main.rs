mod common;
mod config;
mod modules;

use axum::http::{header, HeaderValue, Method};
use axum::Router;
use common::app_state::AppState;
use common::snowflake::SnowflakeIdBucket;
use modules::{business, hr, organization};
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use std::time::Duration;
use tower_http::cors::CorsLayer;
use tower_http::timeout::TimeoutLayer;
use tower_http::trace::{
    DefaultMakeSpan, DefaultOnFailure, DefaultOnRequest, DefaultOnResponse, TraceLayer,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging system (file + console)
    let log_config = config::logging::LogConfig::from_env();
    let _log_guard = log_config.init()?;

    // Capture panic (e.g., unwrap/expect), ensure it is also logged
    std::panic::set_hook(Box::new(|info| {
        let location = info
            .location()
            .map(|l| format!("{}:{}:{}", l.file(), l.line(), l.column()))
            .unwrap_or_else(|| "<unknown>".to_string());
        if let Some(s) = info.payload().downcast_ref::<&str>() {
            tracing::error!("panic at {}: {}", location, s);
        } else if let Some(s) = info.payload().downcast_ref::<String>() {
            tracing::error!("panic at {}: {}", location, s);
        } else {
            tracing::error!("panic at {}", location);
        }
    }));

    // Load configuration
    let config = config::AppConfig::from_env()?;

    // Create database connection pool
    let pool = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .connect(&config.database.url)
        .await?;

    tracing::info!("Database connection established successfully");

    // Run database migrations
    sqlx::migrate!("./migrations").run(&pool).await?;

    // Initialize global Snowflake ID generator
    let id_generator = Arc::new(
        SnowflakeIdBucket::new(config.snowflake.datacenter_id, config.snowflake.machine_id)
            .expect("Failed to create Snowflake ID generator"),
    );

    tracing::info!(
        "Snowflake ID generator initialized successfully (datacenter_id: {}, machine_id: {})",
        config.snowflake.datacenter_id,
        config.snowflake.machine_id
    );

    // Create global application state
    let app_state = AppState::new(pool.clone(), config.jwt.clone(), id_generator);

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(config.server.cors_origin.parse::<HeaderValue>()?)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION, header::ACCEPT])
        .allow_credentials(true)
        .max_age(Duration::from_secs(3600));

    // Mount all routes under /api
    let api_routes = Router::new()
        .merge(modules::auth::auth_routes(app_state.clone()))
        .merge(modules::user::user_routes(app_state.clone()))
        .merge(organization::department::department_routes(
            app_state.clone(),
        ))
        .merge(hr::holiday::holiday_routes(app_state.clone()))
        .merge(organization::team::team_routes(app_state.clone()))
        .merge(business::project::project_routes(app_state.clone()))
        .merge(business::project::task::task_routes(app_state.clone()))
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(
                    DefaultMakeSpan::new()
                        .include_headers(false)
                        .level(tracing::Level::DEBUG),
                )
                .on_request(DefaultOnRequest::new().level(tracing::Level::DEBUG))
                .on_response(
                    DefaultOnResponse::new()
                        .level(tracing::Level::DEBUG)
                        .latency_unit(tower_http::LatencyUnit::Millis),
                )
                .on_failure(
                    DefaultOnFailure::new()
                        .level(tracing::Level::ERROR)
                        .latency_unit(tower_http::LatencyUnit::Millis),
                ),
        )
        .layer(TimeoutLayer::with_status_code(
            axum::http::StatusCode::REQUEST_TIMEOUT,
            Duration::from_secs(30),
        ));

    let app = Router::new().nest("/api", api_routes).layer(cors);

    // Start server
    let addr = format!("{}:{}", config.server.host, config.server.port);
    tracing::info!("Server started at: {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

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
use tower_http::cors::CorsLayer;
use tower_http::trace::{DefaultMakeSpan, DefaultOnFailure, DefaultOnRequest, DefaultOnResponse, TraceLayer};
use tower_http::timeout::TimeoutLayer;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 初始化日志系统（文件 + 控制台）
    let log_config = config::logging::LogConfig::from_env();
    let _log_guard = log_config.init()?;

    // 捕获 panic（例如 unwrap/expect），确保也能落日志
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

    // 加载配置
    let config = config::AppConfig::from_env()?;

    // 创建数据库连接池
    let pool = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .connect(&config.database.url)
        .await?;

    tracing::info!("数据库连接成功");

    // 运行数据库迁移
    sqlx::migrate!("./migrations").run(&pool).await?;

    tracing::info!("数据库迁移完成");

    // 初始化全局 Snowflake ID 生成器
    let id_generator = Arc::new(
        SnowflakeIdBucket::new(
            config.snowflake.datacenter_id,
            config.snowflake.machine_id,
        )
        .expect("Failed to create Snowflake ID generator"),
    );

    tracing::info!(
        "Snowflake ID 生成器初始化成功 (datacenter_id: {}, machine_id: {})",
        config.snowflake.datacenter_id,
        config.snowflake.machine_id
    );

    // 创建全局应用状态
    let app_state = AppState::new(pool.clone(), config.jwt.clone(), id_generator);

    // 配置 CORS
    let cors = CorsLayer::new()
        .allow_origin("http://127.0.0.1:3000".parse::<HeaderValue>()?)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION, header::ACCEPT])
        .allow_credentials(true);

    // 将所有路由挂载到 /api 下
    let api_routes = Router::new()
        .merge(modules::auth::auth_routes(app_state.clone()))
        .merge(modules::user::user_routes(app_state.clone()))
        .merge(organization::department::department_routes(app_state.clone()))
        .merge(hr::holiday::holiday_routes(app_state.clone()))
        .merge(organization::team::team_routes(app_state.clone()))
        .merge(business::project::project_routes(app_state.clone()))
        .merge(business::project::task::task_routes(app_state.clone()))
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(
                    DefaultMakeSpan::new()
                        .include_headers(false)
                        .level(tracing::Level::INFO),
                )
                .on_request(DefaultOnRequest::new().level(tracing::Level::INFO))
                .on_response(
                    DefaultOnResponse::new()
                        .level(tracing::Level::INFO)
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

    // 启动服务器
    let addr = format!("{}:{}", config.server.host, config.server.port);
    tracing::info!("服务器启动于: {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

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

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 初始化日志系统（文件 + 控制台）
    let log_config = config::logging::LogConfig::from_env();
    log_config.init()?;

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
        .merge(business::project::task::task_routes(app_state.clone()));

    let app = Router::new().nest("/api", api_routes).layer(cors);

    // 启动服务器
    let addr = format!("{}:{}", config.server.host, config.server.port);
    tracing::info!("服务器启动于: {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

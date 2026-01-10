mod common;
mod config;
mod modules;

use axum::Router;
use sqlx::postgres::PgPoolOptions;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 初始化日志
    tracing_subscriber::fmt::init();

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

    // 创建应用状态
    let app_state = modules::auth::AppState {
        pool: pool.clone(),
        jwt_config: config.jwt.clone(),
    };

    // 构建应用路由
    // Auth routes have their own state
    let auth_routes = modules::auth::auth_routes(app_state);

    // User routes need PgPool state
    let user_routes = Router::new()
        .nest("/api", modules::user::user_routes())
        .with_state(pool);

    // Merge all routes
    let app = Router::new()
        .merge(auth_routes)
        .merge(user_routes);

    // 启动服务器
    let addr = format!("{}:{}", config.server.host, config.server.port);
    tracing::info!("服务器启动于: {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

pub mod logging;

use serde::Deserialize;

/// 应用配置
#[derive(Debug, Deserialize)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub jwt: JwtConfig,
}

/// 服务器配置
#[derive(Debug, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

/// 数据库配置
#[derive(Debug, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

/// JWT 配置
#[derive(Debug, Deserialize, Clone)]
pub struct JwtConfig {
    pub secret: String,
    pub access_token_expires_in: i64,  // 访问令牌过期时间（秒）
    pub refresh_token_expires_in: i64, // 刷新令牌过期时间（秒）
}

impl AppConfig {
    /// 从环境变量加载配置
    pub fn from_env() -> Result<Self, config::ConfigError> {
        dotenvy::dotenv().ok();

        let config = config::Config::builder()
            .add_source(config::Environment::default().separator("__"))
            .build()?;

        config.try_deserialize()
    }
}

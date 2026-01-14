pub mod logging;

use serde::Deserialize;

/// 应用配置
#[derive(Debug, Deserialize)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub jwt: JwtConfig,
    pub snowflake: SnowflakeConfig,
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

/// Snowflake ID 生成器配置
#[derive(Debug, Deserialize, Clone)]
pub struct SnowflakeConfig {
    pub datacenter_id: i64, // 数据中心ID (0-31)
    pub machine_id: i64,    // 机器ID (0-31)
}

impl Default for SnowflakeConfig {
    fn default() -> Self {
        Self {
            datacenter_id: 1,
            machine_id: 1,
        }
    }
}

impl AppConfig {
    /// 从环境变量加载配置
    pub fn from_env() -> Result<Self, config::ConfigError> {
        dotenvy::dotenv().ok();

        let config = config::Config::builder()
            .add_source(config::Environment::default().separator("__"))
            .set_default("snowflake.datacenter_id", 1)?
            .set_default("snowflake.machine_id", 1)?
            .build()?;

        config.try_deserialize()
    }
}

pub mod logging;

use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub jwt: JwtConfig,
    pub snowflake: SnowflakeConfig,
}

#[derive(Debug, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub cors_origin: String,
}

#[derive(Debug, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct JwtConfig {
    pub secret: String,
    pub access_token_expires_in: i64,
    pub refresh_token_expires_in: i64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SnowflakeConfig {
    pub datacenter_id: i64,
    pub machine_id: i64,
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
    pub fn from_env() -> Result<Self, config::ConfigError> {
        dotenvy::dotenv().ok();

        let config = config::Config::builder()
            .add_source(config::Environment::default().separator("__"))
            .set_default("snowflake.datacenter_id", 1)?
            .set_default("snowflake.machine_id", 1)?
            .set_default("server.cors_origin", "http://localhost:3000")?
            .build()?;

        config.try_deserialize()
    }
}

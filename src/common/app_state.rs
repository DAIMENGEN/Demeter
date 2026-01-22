use crate::common::snowflake::SnowflakeIdBucket;
use crate::config::JwtConfig;
use sqlx::PgPool;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub jwt_config: JwtConfig,
    pub id_generator: Arc<SnowflakeIdBucket>,
}

impl AppState {
    pub fn new(pool: PgPool, jwt_config: JwtConfig, id_generator: Arc<SnowflakeIdBucket>) -> Self {
        Self {
            pool,
            jwt_config,
            id_generator,
        }
    }

    pub fn generate_id(&self) -> Result<i64, crate::common::snowflake::SnowflakeError> {
        self.id_generator.get_id()
    }
}

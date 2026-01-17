use crate::common::snowflake::SnowflakeIdBucket;
use crate::config::JwtConfig;
use sqlx::PgPool;
use std::sync::Arc;

/// 全局应用状态
///
/// 包含所有共享资源，在应用启动时初始化一次，并在整个应用中复用
#[derive(Clone)]
pub struct AppState {
    /// 数据库连接池
    pub pool: PgPool,
    /// JWT 配置
    pub jwt_config: JwtConfig,
    /// Snowflake ID 生成器（线程安全）
    pub id_generator: Arc<SnowflakeIdBucket>,
}

impl AppState {
    /// 创建新的应用状态
    pub fn new(pool: PgPool, jwt_config: JwtConfig, id_generator: Arc<SnowflakeIdBucket>) -> Self {
        Self {
            pool,
            jwt_config,
            id_generator,
        }
    }

    /// 生成新的 Snowflake ID
    ///
    /// # 示例
    /// ```rust
    /// let id = app_state.generate_id()?;
    /// ```
    pub fn generate_id(&self) -> Result<i64, crate::common::snowflake::SnowflakeError> {
        self.id_generator.get_id()
    }
}

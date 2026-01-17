use std::fs;
use std::path::Path;
use std::time::{Duration, SystemTime};
use tracing_appender::non_blocking::WorkerGuard;
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

/// 日志配置
#[derive(Clone)]
pub struct LogConfig {
    /// 日志目录
    pub log_dir: String,
    /// 日志文件前缀
    pub file_prefix: String,
    /// 最大日志文件大小（字节）
    pub max_file_size: u64,
    /// 日志保留天数
    pub retention_days: u64,
}

impl Default for LogConfig {
    fn default() -> Self {
        Self {
            log_dir: "logs".to_string(),
            file_prefix: "demeter".to_string(),
            max_file_size: 10 * 1024 * 1024, // 10MB
            retention_days: 7,
        }
    }
}

impl LogConfig {
    /// 从环境变量加载配置
    pub fn from_env() -> Self {
        Self {
            log_dir: std::env::var("LOG_DIR").unwrap_or_else(|_| "logs".to_string()),
            file_prefix: std::env::var("LOG_FILE_PREFIX").unwrap_or_else(|_| "demeter".to_string()),
            max_file_size: std::env::var("LOG_MAX_FILE_SIZE")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(10 * 1024 * 1024), // 默认10MB
            retention_days: std::env::var("LOG_RETENTION_DAYS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(7), // 默认7天
        }
    }

    /// 初始化日志系统
    pub fn init(self) -> Result<WorkerGuard, Box<dyn std::error::Error>> {
        // 创建日志目录
        fs::create_dir_all(&self.log_dir)?;

        // 清理过期日志
        Self::cleanup_old_logs(&self.log_dir, self.retention_days)?;

        // 记录绝对路径，便于排查日志目录问题
        if let Ok(abs) = fs::canonicalize(&self.log_dir) {
            tracing::info!("Log directory (absolute): {}", abs.display());
        }

        // 配置文件滚动策略 - 按天切割
        let file_appender = RollingFileAppender::builder()
            .rotation(Rotation::DAILY)
            .filename_prefix(&self.file_prefix)
            .filename_suffix("log")
            .max_log_files(self.retention_days as usize)
            .build(&self.log_dir)?;

        // 非阻塞写入，避免请求线程被文件IO阻塞；必须持有guard防止日志丢失
        let (file_writer, guard) = tracing_appender::non_blocking(file_appender);

        // 配置环境过滤器
        let env_filter =
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

        // 创建文件日志层
        let file_layer = fmt::layer()
            .with_writer(file_writer)
            .with_ansi(false)
            .with_target(true)
            .with_thread_ids(true)
            .with_line_number(true)
            .with_file(true);

        // 创建控制台日志层
        let stdout_layer = fmt::layer()
            .with_writer(std::io::stdout)
            .with_ansi(true)
            .with_target(true);

        // 组合订阅者
        tracing_subscriber::registry()
            .with(env_filter)
            .with(file_layer)
            .with(stdout_layer)
            .init();

        tracing::info!(
            "Logging system initialized - directory: {}, max file size: {}MB, retention days: {}",
            self.log_dir,
            self.max_file_size / (1024 * 1024),
            self.retention_days
        );

        Ok(guard)
    }

    /// 清理过期日志文件
    fn cleanup_old_logs(
        log_dir: &str,
        retention_days: u64,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let path = Path::new(log_dir);
        if !path.exists() {
            return Ok(());
        }

        let now = SystemTime::now();
        let retention_duration = Duration::from_secs(retention_days * 24 * 60 * 60);

        for entry in fs::read_dir(path)? {
            let entry = entry?;
            let metadata = entry.metadata()?;

            if metadata.is_file() {
                if let Ok(modified) = metadata.modified() {
                    if let Ok(age) = now.duration_since(modified) {
                        if age > retention_duration {
                            // 删除过期文件
                            if let Err(e) = fs::remove_file(entry.path()) {
                                tracing::warn!(
                                    "Failed to delete expired log file {:?}: {}",
                                    entry.path(),
                                    e
                                );
                            } else {
                                tracing::info!("Deleted expired log file: {:?}", entry.path());
                            }
                        }
                    }
                }
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = LogConfig::default();
        assert_eq!(config.log_dir, "logs");
        assert_eq!(config.file_prefix, "demeter");
        assert_eq!(config.max_file_size, 10 * 1024 * 1024);
        assert_eq!(config.retention_days, 7);
    }
}

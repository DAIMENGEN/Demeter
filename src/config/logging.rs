use std::fs;
use std::path::Path;
use std::time::{Duration, SystemTime};
use tracing_appender::non_blocking::WorkerGuard;
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

#[derive(Clone)]
pub struct LogConfig {
    pub log_dir: String,
    pub file_prefix: String,
    pub max_file_size: u64,
    pub retention_days: u64,
}

impl Default for LogConfig {
    fn default() -> Self {
        Self {
            log_dir: "logs".to_string(),
            file_prefix: "demeter".to_string(),
            max_file_size: 10 * 1024 * 1024,
            retention_days: 7,
        }
    }
}

impl LogConfig {
    pub fn from_env() -> Self {
        Self {
            log_dir: std::env::var("LOG_DIR").unwrap_or_else(|_| "logs".to_string()),
            file_prefix: std::env::var("LOG_FILE_PREFIX").unwrap_or_else(|_| "demeter".to_string()),
            max_file_size: std::env::var("LOG_MAX_FILE_SIZE")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(10 * 1024 * 1024),
            retention_days: std::env::var("LOG_RETENTION_DAYS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(7),
        }
    }

    pub fn init(self) -> Result<WorkerGuard, Box<dyn std::error::Error>> {
        fs::create_dir_all(&self.log_dir)?;
        Self::cleanup_old_logs(&self.log_dir, self.retention_days)?;
        if let Ok(abs) = fs::canonicalize(&self.log_dir) {
            tracing::info!("Log directory (absolute): {}", abs.display());
        }
        let file_appender = RollingFileAppender::builder()
            .rotation(Rotation::DAILY)
            .filename_prefix(&self.file_prefix)
            .filename_suffix("log")
            .max_log_files(self.retention_days as usize)
            .build(&self.log_dir)?;
        let (file_writer, guard) = tracing_appender::non_blocking(file_appender);
        let env_filter =
            EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
        let file_layer = fmt::layer()
            .with_writer(file_writer)
            .with_ansi(false)
            .with_target(true)
            .with_thread_ids(true)
            .with_line_number(true)
            .with_file(true);
        let stdout_layer = fmt::layer()
            .with_writer(std::io::stdout)
            .with_ansi(true)
            .with_target(true);
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

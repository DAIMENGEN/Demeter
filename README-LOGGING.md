# 日志系统说明

## 功能特性

Demeter 项目实现了一个完整的日志记录系统，具有以下特性：

1. **双重输出**：同时输出到文件和控制台
2. **文件轮转**：每天自动创建新的日志文件
3. **自动清理**：自动删除超过保留期限的旧日志文件
4. **大小限制**：可配置单个日志文件的最大大小
5. **详细信息**：包含时间戳、线程ID、源文件位置、行号等详细信息

## 配置选项

日志系统通过环境变量进行配置，可以在 `.env` 文件中设置：

```bash
# 日志目录路径
LOG_DIR=logs

# 日志文件名前缀
LOG_FILE_PREFIX=demeter

# 单个日志文件最大大小（字节），默认 10MB
LOG_MAX_FILE_SIZE=10485760

# 日志保留天数，默认 7 天
LOG_RETENTION_DAYS=7

# 日志级别 (trace, debug, info, warn, error)，默认 info
RUST_LOG=info
```

### 配置说明

- **LOG_DIR**: 日志文件存储目录，默认为 `logs`
- **LOG_FILE_PREFIX**: 日志文件名前缀，默认为 `demeter`
- **LOG_MAX_FILE_SIZE**: 单个日志文件的最大大小（字节），默认为 10MB (10485760 字节)
- **LOG_RETENTION_DAYS**: 日志文件保留天数，默认为 7 天
- **RUST_LOG**: 日志级别，可选值：
  - `trace`: 最详细的日志
  - `debug`: 调试信息
  - `info`: 一般信息（默认）
  - `warn`: 警告信息
  - `error`: 错误信息

## 日志文件格式

日志文件命名格式：`{前缀}.{日期}.log`

例如：`demeter.2026-01-11.log`

### 日志内容格式

```
2026-01-11T03:05:39.270357Z  INFO ThreadId(01) Demeter::config::logging: src\config\logging.rs:91: 日志系统初始化完成 - 目录: logs, 最大文件大小: 10MB, 保留天数: 7
```

包含以下信息：
- 时间戳（UTC 时间）
- 日志级别
- 线程 ID
- 模块路径
- 源文件位置
- 行号
- 日志消息

## 使用示例

### 在代码中记录日志

```rust
use tracing::{info, warn, error, debug, trace};

// 记录信息日志
tracing::info!("数据库连接成功");

// 记录警告日志
tracing::warn!("配置项缺失，使用默认值");

// 记录错误日志
tracing::error!("数据库连接失败: {}", err);

// 记录调试日志
tracing::debug!("处理请求: {:?}", request);

// 记录追踪日志
tracing::trace!("进入函数: process_data");

// 带变量的日志
tracing::info!(
    "用户登录成功 - 用户ID: {}, IP: {}",
    user_id,
    ip_address
);
```

### 模块级别日志过滤

如果只想查看特定模块的日志，可以使用更详细的 `RUST_LOG` 配置：

```bash
# 只显示 auth 模块的 debug 日志，其他模块显示 info
RUST_LOG=demeter::modules::auth=debug,info

# 显示所有模块的 trace 日志
RUST_LOG=trace

# 只显示 error 级别的日志
RUST_LOG=error
```

## 日志轮转和清理

### 自动轮转

- 日志系统每天自动创建新的日志文件
- 文件名包含日期，便于查找和管理
- 轮转发生在每天午夜 UTC 时间

### 自动清理

- 应用启动时自动检查并删除超过保留期限的旧日志文件
- 保留天数由 `LOG_RETENTION_DAYS` 配置
- 清理操作会在日志中记录

### 手动清理

如果需要手动清理日志文件：

```bash
# Windows PowerShell
Get-ChildItem logs -Filter "demeter.*.log" | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item

# Linux/macOS
find logs -name "demeter.*.log" -mtime +7 -delete
```

## 故障排查

### 日志文件未创建

1. 检查 `LOG_DIR` 目录是否有写入权限
2. 检查磁盘空间是否充足
3. 查看控制台输出是否有错误信息

### 日志级别不生效

1. 确认 `.env` 文件中的 `RUST_LOG` 配置正确
2. 确认应用重启后配置已生效
3. 尝试使用环境变量直接设置：`$env:RUST_LOG="debug"; cargo run`

### 日志文件占用过多空间

1. 减少 `LOG_RETENTION_DAYS` 的值
2. 降低 `RUST_LOG` 级别（从 debug 改为 info）
3. 减少 `LOG_MAX_FILE_SIZE` 的值

## 性能建议

1. **生产环境**：使用 `info` 或 `warn` 级别，避免使用 `debug` 或 `trace`
2. **开发环境**：可以使用 `debug` 级别获取更多信息
3. **调试问题**：临时启用 `trace` 级别，问题解决后恢复
4. **磁盘监控**：定期检查日志目录大小，防止占用过多空间

## 技术实现

日志系统使用以下技术栈：

- **tracing**: Rust 异步感知的日志框架
- **tracing-subscriber**: 日志订阅者和格式化工具
- **tracing-appender**: 文件轮转和追加功能

详细实现见 `src/config/logging.rs`


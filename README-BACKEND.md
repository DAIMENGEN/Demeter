# Demeter Rust 后端

基于 Axum + SQLx + PostgreSQL 的 Rust Web 后端实现。

## 项目架构

### 目录结构

```
src/
├── main.rs                 # 应用入口点
├── common/                 # 公共模块
│   ├── mod.rs
│   ├── error.rs           # 统一错误处理
│   └── response.rs        # 统一响应格式
├── config/                # 配置模块
│   └── mod.rs             # 应用配置管理
└── modules/               # 业务模块
    ├── mod.rs
    └── user/              # 用户模块（示例）
        ├── mod.rs         # 模块导出
        ├── models.rs      # 数据模型和请求/响应类型
        ├── repository.rs  # 数据访问层（Database Layer）
        ├── handlers.rs    # 请求处理器（Controller Layer）
        └── routes.rs      # 路由配置
```

### 设计原则

1. **分层架构**
   - **Handler 层**: 处理 HTTP 请求和响应
   - **Repository 层**: 封装数据库操作
   - **Model 层**: 定义数据结构

2. **模块化设计**
   - 每个业务模块独立组织
   - 便于扩展和维护
   - 模块间低耦合

3. **统一错误处理**
   - 自定义 `AppError` 类型
   - 实现 `IntoResponse` trait
   - 统一的错误响应格式

4. **统一响应格式**
   ```json
   {
     "code": 200,
     "message": "success",
     "data": {...}
   }
   ```

## 快速开始

### 1. 环境准备

确保已安装：
- Rust (1.70+)
- PostgreSQL (14+)
- cargo (Rust 包管理器)

### 2. 配置数据库

创建 PostgreSQL 数据库：

```bash
# 连接到 PostgreSQL
psql -U postgres

# 创建数据库和用户
CREATE DATABASE demeter_db;
CREATE USER demeter WITH PASSWORD 'demeter';
GRANT ALL PRIVILEGES ON DATABASE demeter_db TO demeter;
```

配置 `.env` 文件：

```env
SERVER__HOST=0.0.0.0
SERVER__PORT=3000
DATABASE__URL=postgres://demeter:demeter@localhost:5432/demeter_db
DATABASE__MAX_CONNECTIONS=5
```

### 3. 运行数据库迁移

```bash
# 安装 sqlx-cli
cargo install sqlx-cli --no-default-features --features postgres

# 运行迁移
sqlx migrate run
```

### 4. 启动服务

```bash
# 开发模式
cargo run

# 生产模式
cargo build --release
./target/release/Demeter
```

服务将在 `http://0.0.0.0:3000` 启动。

## API 接口

### 用户模块

| 方法 | 路径 | 描述 | 请求体 |
|------|------|------|--------|
| GET | `/api/users` | 获取用户列表（分页） | Query: `page`, `pageSize`, `username`, `fullName`, `email`, `phone`, `isActive` |
| GET | `/api/users/all` | 获取所有用户（不分页） | Query: `username`, `fullName`, `email`, `isActive` |
| GET | `/api/users/:id` | 根据ID获取用户 | - |
| GET | `/api/users/username/:username` | 根据用户名获取用户 | - |
| POST | `/api/users` | 创建用户 | `CreateUserParams` |
| PUT | `/api/users/:id` | 更新用户 | `UpdateUserParams` |
| DELETE | `/api/users/:id` | 删除用户 | - |
| POST | `/api/users/batch-delete` | 批量删除用户 | `{ ids: string[] }` |
| PUT | `/api/users/:id/status` | 切换用户状态 | `{ isActive: boolean }` |

### 请求示例

#### 创建用户

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "1234567890",
    "isActive": true
  }'
```

#### 获取用户列表

```bash
curl "http://localhost:3000/api/users?page=1&pageSize=10&isActive=true"
```

## 技术栈

- **Web 框架**: [Axum 0.8](https://docs.rs/axum) - 基于 Tokio 的高性能 Web 框架
- **数据库**: PostgreSQL - 关系型数据库
- **ORM**: [SQLx 0.8](https://docs.rs/sqlx) - 异步 SQL 工具包，支持编译时 SQL 验证
- **异步运行时**: [Tokio](https://tokio.rs) - Rust 异步运行时
- **序列化**: [Serde](https://serde.rs) - 序列化/反序列化框架
- **日志**: [Tracing](https://docs.rs/tracing) - 结构化日志
- **配置**: [Config](https://docs.rs/config) - 分层配置系统
- **UUID**: [uuid](https://docs.rs/uuid) - UUID 生成

## 添加新模块

要添加新的业务模块，请按照以下步骤：

### 1. 创建模块目录结构

```bash
mkdir src/modules/your_module
```

### 2. 创建必要文件

- `mod.rs` - 模块导出
- `models.rs` - 数据模型
- `repository.rs` - 数据访问层
- `handlers.rs` - 请求处理器
- `routes.rs` - 路由配置

### 3. 在 `src/modules/mod.rs` 中注册模块

```rust
pub mod user;
pub mod your_module;  // 添加新模块
```

### 4. 在 `main.rs` 中挂载路由

```rust
let app = Router::new()
    .merge(modules::user::user_routes())
    .merge(modules::your_module::your_module_routes())  // 添加路由
    .with_state(pool);
```

## 数据库迁移

### 创建新迁移

```bash
sqlx migrate add <migration_name>
```

### 运行迁移

```bash
sqlx migrate run
```

### 回滚迁移

```bash
sqlx migrate revert
```

## 开发建议

1. **使用类型安全**: 尽可能使用 SQLx 的类型检查功能
2. **错误处理**: 使用 `AppResult<T>` 统一处理错误
3. **日志记录**: 使用 `tracing` 进行结构化日志
4. **数据验证**: 在 Handler 层进行输入验证
5. **数据库事务**: 对于复杂操作使用事务确保数据一致性

## 性能优化

1. **连接池**: 使用 SQLx 连接池管理数据库连接
2. **异步I/O**: 充分利用 Tokio 的异步特性
3. **索引优化**: 为常用查询字段添加数据库索引
4. **分页查询**: 对于大数据集使用分页避免内存溢出

## License

MIT


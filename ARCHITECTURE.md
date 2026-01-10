# Demeter 后端架构设计

## 目录结构

```
src/
├── main.rs                    # 应用入口，初始化服务器、数据库连接池和路由
├── common/                    # 公共基础设施模块
│   ├── mod.rs
│   ├── error.rs              # 统一错误类型定义和错误响应转换
│   └── response.rs           # 统一 API 响应格式（ApiResponse, PageResponse）
├── config/                   # 配置管理模块
│   └── mod.rs                # 从环境变量加载应用配置
└── modules/                  # 业务模块
    ├── mod.rs                # 模块注册
    └── user/                 # 用户管理模块
        ├── mod.rs            # 用户模块导出
        ├── models.rs         # 数据模型、请求/响应 DTO
        ├── repository.rs     # 数据访问层（Repository Pattern）
        ├── handlers.rs       # HTTP 请求处理器
        └── routes.rs         # 路由配置
```

## 架构分层

### 1. Handler 层（handlers.rs）
- **职责**: 处理 HTTP 请求和响应
- **功能**:
  - 提取请求参数（Path, Query, Json）
  - 调用 Repository 层执行业务逻辑
  - 构造统一格式的响应
  - 错误处理和状态码映射

### 2. Repository 层（repository.rs）
- **职责**: 封装数据库操作
- **功能**:
  - 执行 SQL 查询（使用 SQLx）
  - 数据持久化和检索
  - 事务管理（未来扩展）
  - 数据库错误处理

### 3. Model 层（models.rs）
- **职责**: 定义数据结构
- **包含**:
  - 数据库实体（User）
  - 请求 DTO（CreateUserParams, UpdateUserParams）
  - 查询参数（UserQueryParams）

## 设计模式

### Repository Pattern
将数据访问逻辑与业务逻辑分离，便于测试和维护。

```rust
pub struct UserRepository;

impl UserRepository {
    pub async fn get_user_by_id(pool: &PgPool, id: &str) -> AppResult<Option<User>> {
        // 数据库查询逻辑
    }
}
```

### 统一错误处理
自定义 `AppError` 类型，实现 `IntoResponse` trait，自动转换为 HTTP 响应。

```rust
pub enum AppError {
    NotFound(String),
    BadRequest(String),
    DatabaseError(sqlx::Error),
}
```

### 统一响应格式
所有 API 响应使用一致的格式，便于前端处理。

```json
{
  "code": 200,
  "message": "success",
  "data": {...}
}
```

## 模块间依赖

```
main.rs
  ├─> config (加载配置)
  ├─> modules::user::routes (注册路由)
  └─> common (错误处理)

user::handlers
  ├─> user::repository (数据访问)
  ├─> user::models (数据结构)
  └─> common::response (响应格式)

user::repository
  ├─> user::models (数据结构)
  └─> common::error (错误类型)
```

## 数据流

```
HTTP Request
  ↓
Router (routes.rs)
  ↓
Handler (handlers.rs)
  ├─ 提取参数
  ├─ 验证输入
  └─ 调用 Repository
      ↓
Repository (repository.rs)
  ├─ 构建 SQL 查询
  ├─ 执行数据库操作
  └─ 返回结果
      ↓
Handler
  ├─ 处理结果
  └─ 构造响应
      ↓
HTTP Response (JSON)
```

## 扩展指南

### 添加新的业务模块

1. **创建模块目录**: `src/modules/your_module/`
2. **实现核心文件**:
   - `models.rs` - 定义数据模型
   - `repository.rs` - 实现数据访问
   - `handlers.rs` - 实现请求处理
   - `routes.rs` - 配置路由
   - `mod.rs` - 导出模块
3. **注册模块**: 在 `src/modules/mod.rs` 添加 `pub mod your_module;`
4. **挂载路由**: 在 `main.rs` 添加 `.merge(modules::your_module::routes())`

### 添加中间件

在 `main.rs` 中使用 Axum 的 layer 系统：

```rust
use tower_http::cors::CorsLayer;

let app = Router::new()
    .merge(modules::user::user_routes())
    .layer(CorsLayer::permissive())
    .with_state(pool);
```

## 性能考虑

1. **数据库连接池**: 使用 SQLx PgPool 复用连接
2. **异步处理**: 所有 I/O 操作使用 async/await
3. **索引优化**: 为常用查询字段创建数据库索引
4. **分页查询**: 避免一次性加载大量数据

## 安全考虑

1. **SQL 注入防护**: 使用参数化查询（SQLx bind）
2. **密码存储**: 建议使用 bcrypt 或 argon2 加密（待实现）
3. **输入验证**: 在 Handler 层验证用户输入
4. **认证授权**: 预留中间件扩展点（TODO）


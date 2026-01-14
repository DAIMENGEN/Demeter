# User Module (用户模块)

## 概述

用户模块已成功实现，遵循现有的模块架构模式。

## 数据库表结构

数据库表名: `users`

字段说明（以 `migrations/20260110000000_create_users_table.sql` 为准）:
- `id` (BIGINT): 主键（Snowflake ID）
- `username` (VARCHAR(50)): 用户名，不可为空，唯一
- `password` (VARCHAR(255)): 密码（服务端存储），不可为空
- `full_name` (VARCHAR(100)): 姓名，不可为空
- `email` (VARCHAR(100)): 邮箱，不可为空，唯一
- `phone` (VARCHAR(20)): 手机号，可为空
- `is_active` (BOOLEAN): 是否启用，默认 `true`
- `creator_id` (BIGINT): 创建者ID，不可为空
- `updater_id` (BIGINT): 更新者ID，可为空
- `create_date_time` (TIMESTAMP): 创建时间，默认 `NOW()`
- `update_date_time` (TIMESTAMP): 更新时间，可为空

索引:
- `idx_users_username`
- `idx_users_email`
- `idx_users_is_active`
- `idx_users_create_date_time`

## API 端点

说明：后端在 `main.rs` 中将所有路由统一挂载在 `/api` 下，因此本文档中的路径均以 `/api` 开头。

> 用户模块的所有接口均受 JWT 中间件保护，需要在请求头中携带：`Authorization: Bearer <accessToken>`。

### 1. 获取用户列表（分页）
- **方法**: GET
- **路径**: `/api/users`
- **查询参数**（与 `UserQueryParams` 一致，camelCase）:
  - `page` (可选): 页码
  - `pageSize` (可选): 每页大小
  - `username` (可选)
  - `fullName` (可选)
  - `email` (可选)
  - `phone` (可选)
  - `isActive` (可选)

### 2. 获取所有用户（不分页）
- **方法**: GET
- **路径**: `/api/users/all`
- **查询参数**: 同上（不包含分页参数也可）

### 3. 根据ID获取用户
- **方法**: GET
- **路径**: `/api/users/{id}`

### 4. 根据用户名获取用户
- **方法**: GET
- **路径**: `/api/users/username/{username}`

### 5. 创建用户
- **方法**: POST
- **路径**: `/api/users`
- **请求体**（`CreateUserParams`）:
```json
{
  "username": "johndoe",
  "password": "your_password",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "isActive": true
}
```

### 6. 更新用户
- **方法**: PUT
- **路径**: `/api/users/{id}`
- **请求体**（`UpdateUserParams`，所有字段可选）:
```json
{
  "username": "johndoe",
  "password": "new_password",
  "fullName": "John D.",
  "email": "john@example.com",
  "phone": "1234567890",
  "isActive": true
}
```

### 7. 切换用户状态
- **方法**: PUT
- **路径**: `/api/users/{id}/status`
- **请求体**（`ToggleUserStatusParams`）:
```json
{
  "isActive": false
}
```

### 8. 删除用户
- **方法**: DELETE
- **路径**: `/api/users/{id}`

### 9. 批量删除用户
- **方法**: POST
- **路径**: `/api/users/batch-delete`
- **请求体**:
```json
{
  "ids": [1, 2, 3]
}
```

## 模块结构

```
src/modules/user/
├── mod.rs          # 模块导出
├── models.rs       # 数据模型定义
├── repository.rs   # 数据库访问层
├── handlers.rs     # 请求处理器
└── routes.rs       # 路由配置
```

## 技术要点

1. **异步数据库操作**: 使用 `sqlx` 进行异步 PostgreSQL 查询
2. **类型安全**: 使用 `sqlx::query_as` 进行类型安全的查询
3. **错误处理**: 统一的错误处理机制
4. **响应格式**: 统一的 API 响应格式
5. **分页支持**: 支持分页和非分页查询
6. **灵活查询**: 支持多条件组合查询

## 数据库迁移

迁移文件位置: `migrations/20260110000000_create_users_table.sql`

运行迁移:
```bash
cargo run
```

应用程序启动时会自动运行所有待执行的迁移。

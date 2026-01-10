# Auth Module (认证模块)

## 概述

认证模块已成功实现，遵循现有的模块架构模式，实现了用户登录、登出、Token 刷新等功能。

## 数据库表结构

数据库表名: `refresh_tokens`

字段说明:
- `id` (BIGSERIAL): 主键，自增ID
- `user_id` (BIGINT): 用户ID，不可为空
- `refresh_token` (VARCHAR(255)): 刷新Token，不可为空，唯一
- `expires_at` (TIMESTAMP): 过期时间，不可为空
- `created_at` (TIMESTAMP): 创建时间，默认值为当前时间
- `updated_at` (TIMESTAMP): 更新时间

索引:
- `idx_refresh_tokens_user_id`: 用户ID索引
- `idx_refresh_tokens_refresh_token`: 刷新Token唯一索引
- `idx_refresh_tokens_expires_at`: 过期时间索引

## API 端点

所有端点都在 `/api/auth` 路径下:

### 1. 用户登录
- **方法**: POST
- **路径**: `/api/auth/login`
- **请求体**:
```json
{
  "username": "johndoe",
  "password": "your_password"
}
```
- **响应**:
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### 2. 用户登出
- **方法**: POST
- **路径**: `/api/auth/logout`
- **请求体**:
```json
{
  "refresh_token": "..."
}
```

### 3. 刷新Token
- **方法**: POST
- **路径**: `/api/auth/refresh`
- **请求体**:
```json
{
  "refresh_token": "..."
}
```
- **响应**:
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

## 模块结构

```
src/modules/auth/
├── mod.rs          # 模块导出
├── models.rs       # 数据模型定义
├── repository.rs   # 数据库访问层
├── handlers.rs     # 请求处理器
└── routes.rs       # 路由配置
```

## 技术要点

1. **JWT 认证**: 使用 JSON Web Token 进行用户认证和授权
2. **刷新Token机制**: 支持刷新Token，提升安全性和用户体验
3. **异步数据库操作**: 使用 `sqlx` 进行异步 PostgreSQL 查询
4. **类型安全**: 使用 `sqlx::query_as` 进行类型安全的查询
5. **错误处理**: 统一的错误处理机制
6. **响应格式**: 统一的 API 响应格式

## 数据库迁移

迁移文件位置: `migrations/20260110000001_create_refresh_tokens_table.sql`

运行迁移:
```bash
cargo run
```

应用程序启动时会自动运行所有待执行的迁移。


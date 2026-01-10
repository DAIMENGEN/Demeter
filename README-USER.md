# User Module (用户模块)

## 概述

用户模块已成功实现，遵循现有的模块架构模式。

## 数据库表结构

数据库表名: `users`

字段说明:
- `id` (BIGSERIAL): 主键，自增ID
- `username` (VARCHAR(255)): 用户名，不可为空，唯一
- `email` (VARCHAR(255)): 邮箱，不可为空，唯一
- `password_hash` (VARCHAR(255)): 密码哈希，不可为空
- `display_name` (VARCHAR(255)): 显示名称
- `role` (INTEGER): 用户角色，不可为空，默认值为 0
- `status` (INTEGER): 用户状态，不可为空，默认值为 1
- `create_date_time` (TIMESTAMP): 创建时间，默认值为 '2022-10-08 00:00:00'
- `update_date_time` (TIMESTAMP): 更新时间

索引:
- `idx_users_username`: 用户名唯一索引
- `idx_users_email`: 邮箱唯一索引
- `idx_users_role`: 用户角色索引
- `idx_users_status`: 用户状态索引
- `idx_users_create_date_time`: 创建时间倒序索引

## API 端点

所有端点都在 `/api/users` 路径下:

### 1. 获取用户列表（分页）
- **方法**: GET
- **路径**: `/api/users`
- **查询参数**:
  - `page` (可选): 页码，默认为 1
  - `page_size` (可选): 每页大小，默认为 10
  - `username` (可选): 用户名模糊搜索
  - `email` (可选): 邮箱模糊搜索
  - `role` (可选): 用户角色
  - `status` (可选): 用户状态
  - `start_date` (可选): 开始日期
  - `end_date` (可选): 结束日期

### 2. 获取所有用户（不分页）
- **方法**: GET
- **路径**: `/api/users/all`
- **查询参数**: 同上（除了 page 和 page_size）

### 3. 根据ID获取用户
- **方法**: GET
- **路径**: `/api/users/{id}`

### 4. 创建用户
- **方法**: POST
- **路径**: `/api/users`
- **请求体**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "your_password",
  "display_name": "John Doe",
  "role": 1
}
```

### 5. 更新用户
- **方法**: PUT
- **路径**: `/api/users/{id}`
- **请求体**: 所有字段都是可选的
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "new_password",
  "display_name": "John D.",
  "role": 2,
  "status": 1
}
```

### 6. 删除用户
- **方法**: DELETE
- **路径**: `/api/users/{id}`

### 7. 批量删除用户
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



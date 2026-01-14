# Team Module (团队模块)

## 概述

团队模块已实现，遵循现有的模块架构模式。

## 数据库表结构

数据库表名: `teams`

字段说明（以 `migrations/20260110000004_create_teams_table.sql` 为准）:
- `id` (BIGINT): 主键（Snowflake ID）
- `team_name` (VARCHAR(255)): 团队名称，不可为空
- `description` (TEXT): 团队描述，可为空
- `creator_id` (BIGINT): 创建者ID，不可为空
- `updater_id` (BIGINT): 更新者ID，可为空
- `create_date_time` (TIMESTAMP): 创建时间
- `update_date_time` (TIMESTAMP): 更新时间，可为空

索引:
- `idx_teams_team_name`
- `idx_teams_creator_id`
- `idx_teams_create_date_time`

## API 端点

说明：后端在 `main.rs` 中将所有路由统一挂载在 `/api` 下，因此本文档中的路径均以 `/api` 开头。

> 团队模块的所有接口均受 JWT 中间件保护，需要在请求头中携带：`Authorization: Bearer <accessToken>`。

### 1. 获取团队列表（分页）
- **方法**: GET
- **路径**: `/api/teams`
- **查询参数**（`TeamQueryParams`，camelCase）:
  - `page` (可选)
  - `pageSize` (可选)
  - `teamName` (可选): 团队名称（模糊匹配）

### 2. 获取所有团队（不分页）
- **方法**: GET
- **路径**: `/api/teams/all`

### 3. 根据ID获取团队
- **方法**: GET
- **路径**: `/api/teams/{id}`

### 4. 根据名称获取团队
- **方法**: GET
- **路径**: `/api/teams/name/{team_name}`

### 5. 创建团队
- **方法**: POST
- **路径**: `/api/teams`
- **请求体**（`CreateTeamParams`）:
```json
{
  "teamName": "研发一组",
  "description": "负责核心产品开发"
}
```

### 6. 更新团队
- **方法**: PUT
- **路径**: `/api/teams/{id}`
- **请求体**（`UpdateTeamParams`，所有字段可选）:
```json
{
  "teamName": "研发一组",
  "description": "更新后的描述"
}
```

### 7. 删除团队
- **方法**: DELETE
- **路径**: `/api/teams/{id}`

### 8. 批量删除团队
- **方法**: POST
- **路径**: `/api/teams/batch-delete`
- **请求体**:
```json
{
  "ids": [1, 2, 3]
}
```

## 模块结构

```
src/modules/organization/team/
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

迁移文件位置: `migrations/20260110000004_create_teams_table.sql`

运行迁移:
```bash
cargo run
```

应用程序启动时会自动运行所有待执行的迁移。


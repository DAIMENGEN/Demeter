# Project Module (项目模块)

## 概述

项目模块已成功实现，遵循现有的模块架构模式。

## 数据库表结构

数据库表名: `projects`

字段说明（以 `migrations/20260111000000_create_projects_table.sql` 为准）:
- `id` (BIGINT): 主键（Snowflake ID）
- `project_name` (VARCHAR(255)): 项目名称，不可为空
- `description` (TEXT): 项目描述，可为空
- `start_date_time` (TIMESTAMP): 项目开始时间，不可为空
- `end_date_time` (TIMESTAMP): 项目结束时间，可为空
- `project_status` (INTEGER): 项目状态，不可为空
- `version` (INTEGER): 版本号，可为空
- `order` (DOUBLE PRECISION): 排序字段，可为空
- `creator_id` (BIGINT): 创建者ID，不可为空
- `updater_id` (BIGINT): 更新者ID，可为空
- `create_date_time` (TIMESTAMP): 创建时间
- `update_date_time` (TIMESTAMP): 更新时间，可为空

索引:
- `idx_projects_project_name`
- `idx_projects_project_status`
- `idx_projects_start_date_time`
- `idx_projects_create_date_time`
- `idx_projects_order`

## API 端点

说明：后端在 `main.rs` 中将所有路由统一挂载在 `/api` 下，因此本文档中的路径均以 `/api` 开头。

> 项目模块的所有接口均受 JWT 中间件保护，需要在请求头中携带：`Authorization: Bearer <accessToken>`。

### 1. 获取项目列表（分页）
- **方法**: GET
- **路径**: `/api/projects`
- **查询参数**（`ProjectQueryParams`，camelCase）:
  - `page` (可选)
  - `pageSize` (可选)
  - `projectName` (可选)
  - `projectStatus` (可选)
  - `startDateTime` (可选)
  - `endDateTime` (可选)
  - `creatorId` (可选)

### 2. 获取所有项目（不分页）
- **方法**: GET
- **路径**: `/api/projects/all`

### 3. 获取我的项目列表（分页）
- **方法**: GET
- **路径**: `/api/projects/my`

### 4. 获取我的所有项目（不分页）
- **方法**: GET
- **路径**: `/api/projects/my/all`

### 5. 根据ID获取项目
- **方法**: GET
- **路径**: `/api/projects/{id}`

### 6. 根据名称获取项目
- **方法**: GET
- **路径**: `/api/projects/name/{project_name}`

### 7. 创建项目
- **方法**: POST
- **路径**: `/api/projects`
- **请求体**（`CreateProjectParams`）:
```json
{
  "projectName": "新项目",
  "description": "项目描述",
  "startDateTime": "2026-01-01T00:00:00",
  "endDateTime": "2026-12-31T23:59:59",
  "projectStatus": 1,
  "version": 1,
  "order": 1.0
}
```

### 8. 更新项目
- **方法**: PUT
- **路径**: `/api/projects/{id}`
- **请求体**（`UpdateProjectParams`，所有字段可选）:
```json
{
  "projectName": "更新后的项目名称",
  "description": "更新后的描述",
  "startDateTime": "2026-02-01T00:00:00",
  "endDateTime": "2026-11-30T23:59:59",
  "projectStatus": 2,
  "version": 2,
  "order": 2.0
}
```

### 9. 删除项目
- **方法**: DELETE
- **路径**: `/api/projects/{id}`

### 10. 批量删除项目
- **方法**: POST
- **路径**: `/api/projects/batch-delete`
- **请求体**:
```json
{
  "ids": [1, 2, 3]
}
```

## 模块结构

```
src/modules/business/project/
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

迁移文件位置: `migrations/20260111000000_create_projects_table.sql`

运行迁移:
```bash
cargo run
```

应用程序启动时会自动运行所有待执行的迁移。

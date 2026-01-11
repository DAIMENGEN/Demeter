# Project Module (项目模块)

## 概述

项目模块已成功实现，遵循现有的用户/假期模块架构模式。

## 数据库表结构

数据库表名: `projects`

字段说明:
- `id` (BIGSERIAL): 主键，自增ID
- `project_name` (VARCHAR(255)): 项目名称，不可为空
- `description` (TEXT): 项目描述
- `start_date_time` (VARCHAR(10)): 项目开始日期，不可为空（如 `YYYY-MM-DD`）
- `end_date_time` (VARCHAR(10)): 项目结束日期
- `project_status` (INTEGER): 项目状态，不可为空
- `version` (INTEGER): 版本号
- `order` (INTEGER): 排序字段
- `creator_id` (BIGINT): 创建者ID，不可为空
- `updater_id` (BIGINT): 更新者ID
- `create_date_time` (TIMESTAMP): 创建时间，默认值为 '2022-10-08 00:00:00'
- `update_date_time` (TIMESTAMP): 更新时间

索引:
- `idx_projects_project_name`: 项目名称索引
- `idx_projects_project_status`: 项目状态索引
- `idx_projects_start_date_time`: 开始日期索引
- `idx_projects_create_date_time`: 创建时间倒序索引
- `idx_projects_order`: 排序字段索引

## API 端点

所有端点都在 `/api/projects` 路径下:

### 1. 获取项目列表（分页）
- **方法**: GET
- **路径**: `/api/projects`
- **查询参数**:
  - `page` (可选): 页码，默认为 1
  - `page_size` (可选): 每页大小，默认为 10
  - `project_name` (可选): 项目名称模糊搜索
  - `project_status` (可选): 项目状态
  - `start_date_time` (可选): 开始日期（大于等于）
  - `end_date_time` (可选): 结束日期（小于等于）

### 2. 获取所有项目（不分页）
- **方法**: GET
- **路径**: `/api/projects/all`
- **查询参数**: 同上（除了 page 和 page_size）

### 3. 根据ID获取项目
- **方法**: GET
- **路径**: `/api/projects/{id}`

### 4. 根据名称获取项目
- **方法**: GET
- **路径**: `/api/projects/name/{project_name}`

### 5. 创建项目
- **方法**: POST
- **路径**: `/api/projects`
- **请求体**:
```json
{
  "project_name": "新项目",
  "description": "项目描述",
  "start_date_time": "2026-01-01",
  "end_date_time": "2026-12-31",
  "project_status": 1,
  "version": 1,
  "order": 1
}
```

### 6. 更新项目
- **方法**: PUT
- **路径**: `/api/projects/{id}`
- **请求体**: 所有字段都是可选的
```json
{
  "project_name": "更新后的项目名称",
  "description": "更新后的描述",
  "start_date_time": "2026-02-01",
  "end_date_time": "2026-11-30",
  "project_status": 2,
  "version": 2,
  "order": 2
}
```

### 7. 删除项目
- **方法**: DELETE
- **路径**: `/api/projects/{id}`

### 8. 批量删除项目
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



# Task Module (任务模块)

## 概述

Task 模块是 Project 模块的子模块，为项目提供任务管理功能。该模块支持可配置的任务属性，允许不同项目根据业务需求定义不同的任务字段。

## 核心特性

### 1. 任务属性配置化
- 每个项目可以定义自己的任务属性配置
- 支持多种属性类型：`text`、`number`、`boolean`、`date`、`datetime`、`select`
- 可设置属性是否必填、默认值、选项等
- 同一项目下的所有任务遵循统一的属性结构

### 2. 任务固有字段
每个任务包含以下固定字段（API 返回为 camelCase）：
- `id`: 任务ID（Snowflake ID）
- `taskName`: 任务名称（必填）
- `parentId`: 父任务ID（支持任务层级结构）
- `projectId`: 所属项目ID
- `order`: 排序字段（必填）
- `startDateTime`: 开始时间（必填）
- `endDateTime`: 结束时间（必填）
- `taskType`: 任务类型（整型枚举，必填）
- `creatorId`: 创建者ID
- `updaterId`: 更新者ID
- `createDateTime`: 创建时间
- `updateDateTime`: 更新时间
- `customAttributes`: 自定义属性（JSON 对象）

### 3. 自定义属性存储
- 使用 PostgreSQL 的 JSONB 类型存储自定义属性
- 支持灵活的属性结构
- 通过 GIN 索引优化 JSONB 查询性能

## 数据库结构

### 任务属性配置表 (project_task_attribute_configs)
以 `migrations/20260113000000_create_tasks_table.sql` 为准：

- `id` (BIGINT): 主键（Snowflake ID）
- `project_id` (BIGINT): 外键关联 `projects(id)`
- `attribute_name` (VARCHAR): 属性名称（同一 project 下唯一）
- `attribute_label` (VARCHAR): 属性显示名称
- `attribute_type` (VARCHAR): 属性类型（text/number/boolean/date/datetime/select）
- `is_required` (BOOLEAN): 是否必填
- `default_value` (TEXT): 默认值
- `options` (JSONB): select 类型的选项配置（可选）
- `value_color_map` (JSONB): 属性值颜色映射（可选），格式示例：`{"高":"#FF0000","中":"#FFA500"}`
- `order` (DOUBLE PRECISION): 排序
- `creator_id`, `updater_id`, `create_date_time`, `update_date_time`

### 任务表 (project_tasks)

- `id` (BIGINT): 主键（Snowflake ID）
- `task_name` (VARCHAR): 任务名称（必填）
- `parent_id` (BIGINT): 自引用外键，关联 `project_tasks(id)`
- `project_id` (BIGINT): 外键关联 `projects(id)`
- `order` (DOUBLE PRECISION): 排序字段（必填）
- `start_date_time` (TIMESTAMP): 开始时间（必填）
- `end_date_time` (TIMESTAMP): 结束时间（必填）
- `task_type` (INT): 任务类型（必填）
- `custom_attributes` (JSONB): 自定义属性（默认 `{}`）
- `creator_id`, `updater_id`, `create_date_time`, `update_date_time`

## API 端点

说明：后端在 `main.rs` 中将所有路由统一挂载在 `/api` 下，因此本文档中的路径均以 `/api` 开头。

> Task 模块的所有接口均受 JWT 中间件保护，需要在请求头中携带：`Authorization: Bearer <accessToken>`。

### 任务属性配置管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/{projectId}/task-attributes` | 获取项目的所有任务属性配置 |
| POST | `/api/projects/{projectId}/task-attributes` | 创建任务属性配置 |
| GET | `/api/projects/{projectId}/task-attributes/{configId}` | 获取指定任务属性配置 |
| PUT | `/api/projects/{projectId}/task-attributes/{configId}` | 更新任务属性配置 |
| DELETE | `/api/projects/{projectId}/task-attributes/{configId}` | 删除任务属性配置 |
| POST | `/api/projects/{projectId}/task-attributes/batch-delete` | 批量删除任务属性配置 |

### 任务管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/{projectId}/tasks` | 获取任务列表（分页） |
| GET | `/api/projects/{projectId}/tasks/all` | 获取所有任务（不分页） |
| POST | `/api/projects/{projectId}/tasks` | 创建任务 |
| GET | `/api/projects/{projectId}/tasks/{taskId}` | 获取指定任务 |
| PUT | `/api/projects/{projectId}/tasks/{taskId}` | 更新任务 |
| DELETE | `/api/projects/{projectId}/tasks/{taskId}` | 删除任务 |
| POST | `/api/projects/{projectId}/tasks/batch-delete` | 批量删除任务 |

## 使用示例

### 1. 创建任务属性配置（select + 颜色映射）
```http
POST /api/projects/1/task-attributes
Content-Type: application/json

{
  "attributeName": "priority",
  "attributeLabel": "优先级",
  "attributeType": "select",
  "isRequired": true,
  "defaultValue": "中",
  "options": ["高", "中", "低"],
  "valueColorMap": {
    "高": "#FF0000",
    "中": "#FFA500",
    "低": "#00FF00"
  },
  "order": 1.0
}
```

> 说明：`options` / `valueColorMap` 在后端以 JSONB 存储；其具体结构由前端和业务约定，后端按 JSON 原样保存。

### 2. 创建任务
```http
POST /api/projects/1/tasks
Content-Type: application/json

{
  "taskName": "完成需求分析",
  "parentId": null,
  "order": 1.0,
  "startDateTime": "2026-01-15T09:00:00",
  "endDateTime": "2026-01-15T18:00:00",
  "taskType": 1,
  "customAttributes": {
    "priority": "高",
    "estimatedHours": 8,
    "assignee": "张三"
  }
}
```

### 3. 查询任务
```
GET /api/projects/1/tasks?page=1&pageSize=10&taskName=需求
```

## 技术实现

- **Web 框架**: Axum
- **数据库**: PostgreSQL
- **ORM**: SQLx
- **JSON 处理**: serde_json
- **认证**: JWT（通过中间件保护所有路由）

## 注意事项

1. 所有 API 端点都需要 JWT 认证
2. 创建任务时，`customAttributes` 应符合项目定义的属性配置
3. 删除任务属性配置不会影响已创建任务的自定义属性数据
4. 删除任务会级联删除其所有子任务
5. 删除项目会级联删除该项目的所有任务和属性配置

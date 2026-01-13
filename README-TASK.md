# Task Module (任务模块)

## 概述

Task 模块是 Project 模块的子模块，为项目提供任务管理功能。该模块支持可配置的任务属性，允许不同项目根据业务需求定义不同的任务字段。

## 核心特性

### 1. 任务属性配置化
- 每个项目可以定义自己的任务属性配置
- 支持多种属性类型：text（文本）、number（数字）、boolean（布尔值）、date（日期）、datetime（日期时间）、select（选择）
- 可设置属性是否必填、默认值等
- 同一项目下的所有任务遵循统一的属性结构

### 2. 任务固有字段
每个任务包含以下固定字段：
- `id`: 任务ID（自增）
- `task_name`: 任务名称
- `parent_id`: 父任务ID（支持任务层级结构）
- `project_id`: 所属项目ID
- `order`: 排序字段
- `creator_id`: 创建者ID
- `updater_id`: 更新者ID
- `create_date_time`: 创建时间
- `update_date_time`: 更新时间
- `custom_attributes`: 自定义属性（JSONB格式）

### 3. 自定义属性存储
- 使用 PostgreSQL 的 JSONB 类型存储自定义属性
- 支持灵活的属性结构，同时保证数据类型安全
- 可通过 GIN 索引优化 JSONB 查询性能

## 数据库结构

### 任务属性配置表 (project_task_attribute_configs)
```sql
- id: BIGSERIAL PRIMARY KEY
- project_id: BIGINT (外键关联 projects 表)
- attribute_name: VARCHAR(255) (属性名称)
- attribute_label: VARCHAR(255) (属性标签)
- attribute_type: VARCHAR(50) (属性类型)
- is_required: BOOLEAN (是否必填)
- default_value: TEXT (默认值)
- options: JSONB (选项配置，用于 select 类型)
- order: DOUBLE PRECISION (排序)
- creator_id, updater_id, create_date_time, update_date_time
```

### 任务表 (project_tasks)
```sql
- id: BIGSERIAL PRIMARY KEY
- task_name: VARCHAR(255)
- parent_id: BIGINT (外键关联 project_tasks 表，自引用)
- project_id: BIGINT (外键关联 projects 表)
- order: DOUBLE PRECISION
- custom_attributes: JSONB (自定义属性)
- creator_id, updater_id, create_date_time, update_date_time
```

## API 端点

### 任务属性配置管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/{project_id}/task-attributes` | 获取项目的所有任务属性配置 |
| POST | `/api/projects/{project_id}/task-attributes` | 创建任务属性配置 |
| GET | `/api/projects/{project_id}/task-attributes/{config_id}` | 获取指定任务属性配置 |
| PUT | `/api/projects/{project_id}/task-attributes/{config_id}` | 更新任务属性配置 |
| DELETE | `/api/projects/{project_id}/task-attributes/{config_id}` | 删除任务属性配置 |
| POST | `/api/projects/{project_id}/task-attributes/batch-delete` | 批量删除任务属性配置 |

### 任务管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/{project_id}/tasks` | 获取任务列表（分页） |
| GET | `/api/projects/{project_id}/tasks/all` | 获取所有任务（不分页） |
| POST | `/api/projects/{project_id}/tasks` | 创建任务 |
| GET | `/api/projects/{project_id}/tasks/{task_id}` | 获取指定任务 |
| PUT | `/api/projects/{project_id}/tasks/{task_id}` | 更新任务 |
| DELETE | `/api/projects/{project_id}/tasks/{task_id}` | 删除任务 |
| POST | `/api/projects/{project_id}/tasks/batch-delete` | 批量删除任务 |

## 使用示例

### 1. 创建任务属性配置
```json
POST /api/projects/1/task-attributes
{
  "attributeName": "priority",
  "attributeLabel": "优先级",
  "attributeType": "select",
  "isRequired": true,
  "options": ["高", "中", "低"],
  "order": 1.0
}
```

### 2. 创建任务
```json
POST /api/projects/1/tasks
{
  "taskName": "完成需求分析",
  "parentId": null,
  "order": 1.0,
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
- **ORM**: SQLx (使用动态查询以支持运行时灵活性)
- **JSON 处理**: serde_json
- **认证**: JWT (通过中间件保护所有路由)

## 注意事项

1. 所有 API 端点都需要 JWT 认证
2. 创建任务时，`customAttributes` 应符合项目定义的属性配置
3. 删除任务属性配置时，不会影响已创建任务的自定义属性数据
4. 删除任务时，会级联删除其所有子任务
5. 删除项目时，会级联删除该项目的所有任务和属性配置
6. **颜色配置说明**：
   - `valueColorMap` 是可选字段，用于为属性值设置颜色
   - 颜色值必须使用 16 进制格式（如 `#FF0000`）
   - 建议为 select 类型的属性配置颜色映射
   - 颜色映射的键应该与 `options` 中的选项值对应
   - 前端可以使用这些颜色信息进行视觉渲染，提升用户体验


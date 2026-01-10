# Team Module (团队模块)

## 概述

团队模块已实现，遵循现有的用户和假期模块架构模式。

## 数据库表结构

数据库表名: `teams`

字段说明:
- `id` (BIGSERIAL): 主键，自增ID
- `team_name` (VARCHAR(255)): 团队名称，不可为空
- `description` (TEXT): 团队描述
- `department_id` (BIGINT): 所属部门ID，不可为空
- `leader_id` (BIGINT): 团队负责人ID，不可为空
- `create_date_time` (TIMESTAMP): 创建时间，默认值为当前时间
- `update_date_time` (TIMESTAMP): 更新时间

索引:
- `idx_teams_team_name`: 团队名称索引
- `idx_teams_department_id`: 部门ID索引
- `idx_teams_leader_id`: 负责人ID索引
- `idx_teams_create_date_time`: 创建时间倒序索引

## API 端点

所有端点都在 `/api/teams` 路径下:

### 1. 获取团队列表（分页）
- **方法**: GET
- **路径**: `/api/teams`
- **查询参数**:
  - `page` (可选): 页码，默认为 1
  - `page_size` (可选): 每页大小，默认为 10
  - `team_name` (可选): 团队名称模糊搜索
  - `department_id` (可选): 部门ID
  - `leader_id` (可选): 负责人ID

### 2. 获取所有团队（不分页）
- **方法**: GET
- **路径**: `/api/teams/all`
- **查询参数**: 同上（除了 page 和 page_size）

### 3. 根据ID获取团队
- **方法**: GET
- **路径**: `/api/teams/{id}`

### 4. 创建团队
- **方法**: POST
- **路径**: `/api/teams`
- **请求体**:
```json
{
  "team_name": "研发一组",
  "description": "负责核心产品开发",
  "department_id": 1,
  "leader_id": 2
}
```

### 5. 更新团队
- **方法**: PUT
- **路径**: `/api/teams/{id}`
- **请求体**: 所有字段都是可选的
```json
{
  "team_name": "研发一组",
  "description": "更新后的描述",
  "department_id": 1,
  "leader_id": 2
}
```

### 6. 删除团队
- **方法**: DELETE
- **路径**: `/api/teams/{id}`

### 7. 批量删除团队
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
src/modules/team/
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



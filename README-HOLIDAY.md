# Holiday Module (假期模块)

## 概述

Holiday 模块是 HR 子模块，为组织提供假期管理功能。该模块支持自定义假期类型、假期批量导入、假期查询等，满足不同组织的假期管理需求。

## 核心特性

### 1. 假期类型自定义
- 支持为组织定义多种假期类型（如法定节假日、调休、公司福利假等）
- 假期类型可配置名称、颜色、描述等属性

### 2. 假期管理
- 支持单个假期的增删改查
- 支持批量导入假期（如每年法定节假日）
- 支持按年份、类型、名称等条件查询假期

### 3. 假期固有字段
每个假期包含以下固定字段（API 返回为 camelCase）：
- `id`: 假期ID（Snowflake ID）
- `holidayName`: 假期名称
- `holidayType`: 假期类型（如节假日、调休等）
- `startDate`: 开始日期
- `endDate`: 结束日期
- `description`: 假期描述
- `color`: 类型颜色（可选）
- `creatorId`: 创建者ID
- `updaterId`: 更新者ID
- `createDateTime`: 创建时间
- `updateDateTime`: 更新时间

## 数据库结构

### 假期类型表 (holiday_types)
- `id` (BIGINT): 主键（Snowflake ID）
- `type_name` (VARCHAR): 类型名称（如“法定节假日”）
- `color` (VARCHAR): 类型颜色（如“#FF0000”）
- `description` (TEXT): 类型描述
- `creator_id`, `updater_id`, `create_date_time`, `update_date_time`

### 假期表 (holidays)
- `id` (BIGINT): 主键（Snowflake ID）
- `holiday_name` (VARCHAR): 假期名称
- `holiday_type_id` (BIGINT): 外键关联 `holiday_types(id)`
- `start_date` (DATE): 开始日期
- `end_date` (DATE): 结束日期
- `description` (TEXT): 假期描述
- `creator_id`, `updater_id`, `create_date_time`, `update_date_time`

## API 端点

说明：后端在 `main.rs` 中将所有路由统一挂载在 `/api` 下，因此本文档中的路径均以 `/api` 开头。

> Holiday 模块的所有接口均受 JWT 中间件保护，需要在请求头中携带：`Authorization: Bearer <accessToken>`。

### 假期类型管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/holiday-types` | 获取所有假期类型 |
| POST | `/api/holiday-types` | 创建假期类型 |
| GET | `/api/holiday-types/{typeId}` | 获取指定假期类型 |
| PUT | `/api/holiday-types/{typeId}` | 更新假期类型 |
| DELETE | `/api/holiday-types/{typeId}` | 删除假期类型 |

### 假期管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/holidays` | 获取假期列表（支持分页、筛选） |
| POST | `/api/holidays` | 创建假期 |
| GET | `/api/holidays/{holidayId}` | 获取指定假期 |
| PUT | `/api/holidays/{holidayId}` | 更新假期 |
| DELETE | `/api/holidays/{holidayId}` | 删除假期 |
| POST | `/api/holidays/batch-import` | 批量导入假期 |

## 使用示例

### 1. 创建假期类型
```http
POST /api/holiday-types
Content-Type: application/json

{
  "typeName": "法定节假日",
  "color": "#FF0000",
  "description": "国家法定节假日"
}
```

### 2. 创建假期
```http
POST /api/holidays
Content-Type: application/json

{
  "holidayName": "春节",
  "holidayTypeId": 1,
  "startDate": "2026-02-17",
  "endDate": "2026-02-23",
  "description": "农历新年假期"
}
```

### 3. 批量导入假期
```http
POST /api/holidays/batch-import
Content-Type: application/json

[
  {
    "holidayName": "清明节",
    "holidayTypeId": 1,
    "startDate": "2026-04-04",
    "endDate": "2026-04-06",
    "description": "清明节假期"
  },
  {
    "holidayName": "劳动节",
    "holidayTypeId": 1,
    "startDate": "2026-05-01",
    "endDate": "2026-05-03",
    "description": "五一劳动节"
  }
]
```

### 4. 查询假期
```
GET /api/holidays?page=1&pageSize=10&holidayName=春节&year=2026
```

## 技术实现

- **Web 框架**: Axum
- **数据库**: PostgreSQL
- **ORM**: SQLx
- **JSON 处理**: serde_json
- **认证**: JWT（通过中间件保护所有路由）

## 注意事项

1. 所有 API 端点都需要 JWT 认证
2. 批量导入假期时，需保证数据格式正确，避免重复导入
3. 删除假期类型不会影响已创建假期的数据，但建议谨慎操作
4. 假期查询支持多条件筛选，如年份、类型、名称等
5. 删除假期类型时，建议先确认无假期引用该类型


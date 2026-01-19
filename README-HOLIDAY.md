# Holiday Module (假期模块)

## 概述

假期模块已成功实现，遵循现有的模块架构模式。

## 数据库表结构

数据库表名: `holidays`

字段说明（以 `migrations/20260110000002_create_holidays_table.sql` 为准）:
- `id` (BIGINT): 主键（Snowflake ID）
- `holiday_name` (VARCHAR(255)): 假期名称，不可为空
- `description` (TEXT): 假期描述，可为空
- `holiday_date` (DATE): 假期日期，不可为空
- `holiday_type` (INTEGER): 假期类型，不可为空
- `country_code` (INTEGER): 国家代码，不可为空
- `creator_id` (BIGINT): 创建者ID，不可为空
- `updater_id` (BIGINT): 更新者ID，可为空
- `create_date_time` (TIMESTAMP): 创建时间
- `update_date_time` (TIMESTAMP): 更新时间，可为空

索引:
- `idx_holidays_holiday_date`
- `idx_holidays_holiday_type`
- `idx_holidays_country_code`
- `idx_holidays_create_date_time`

## API 端点

说明：后端在 `main.rs` 中将所有路由统一挂载在 `/api` 下，因此本文档中的路径均以 `/api` 开头。

> 假期模块的所有接口均受 JWT 中间件保护，需要在请求头中携带：`Authorization: Bearer <accessToken>`。

### 1. 获取假期列表（分页）
- **方法**: GET
- **路径**: `/api/holidays`
- **查询参数**（`HolidayQueryParams`，camelCase）:
  - `page` (可选)
  - `pageSize` (可选)
  - `holidayName` (可选)
  - `holidayType` (可选)
  - `countryCode` (可选)
  - `startDate` (可选)
  - `endDate` (可选)

### 2. 获取所有假期（不分页）
- **方法**: GET
- **路径**: `/api/holidays/all`

### 3. 根据ID获取假期
- **方法**: GET
- **路径**: `/api/holidays/{id}`

### 4. 创建假期
- **方法**: POST
- **路径**: `/api/holidays`
- **请求体**（`CreateHolidayParams`）:
```json
{
  "holidayName": "春节",
  "description": "中国传统新年",
  "holidayDate": "2026-01-29",
  "holidayType": 1,
  "countryCode": 86
}
```

### 5. 更新假期
- **方法**: PUT
- **路径**: `/api/holidays/{id}`
- **请求体**（`UpdateHolidayParams`，所有字段可选）:
```json
{
  "holidayName": "春节",
  "description": "更新后的描述",
  "holidayDate": "2026-01-29",
  "holidayType": 1,
  "countryCode": 86
}
```

### 6. 删除假期
- **方法**: DELETE
- **路径**: `/api/holidays/{id}`

### 7. 批量删除假期
- **方法**: POST
- **路径**: `/api/holidays/batch-delete`
- **请求体**:
```json
{
  "ids": [1, 2, 3]
}
```

### 8. 批量创建假期
- **方法**: POST
- **路径**: `/api/holidays/batch-create`
- **请求体**:
```json
{
  "holidays": [
    {
      "holidayName": "春节",
      "description": "中国传统新年",
      "holidayDate": "2026-01-29",
      "holidayType": 1,
      "countryCode": 86
    },
    {
      "holidayName": "劳动节",
      "description": "国际劳动节",
      "holidayDate": "2026-05-01",
      "holidayType": 1,
      "countryCode": 86
    }
  ]
}
```

## 模块结构

```
src/modules/hr/holiday/
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

迁移文件位置: `migrations/20260110000002_create_holidays_table.sql`

运行迁移:
```bash
cargo run
```

应用程序启动时会自动运行所有待执行的迁移。


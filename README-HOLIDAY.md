# Holiday Module (假期模块)

## 概述

假期模块已成功实现，遵循现有的用户模块架构模式。

## 数据库表结构

数据库表名: `holidays`

字段说明:
- `id` (BIGSERIAL): 主键，自增ID
- `holiday_name` (VARCHAR(255)): 假期名称，不可为空
- `description` (TEXT): 假期描述
- `holiday_date` (DATE): 假期日期，不可为空
- `holiday_type` (INTEGER): 假期类型，不可为空
- `is_recurring` (BOOLEAN): 是否循环假期，默认值为 false
- `country_code` (INTEGER): 国家代码，不可为空
- `creator_id` (BIGINT): 创建者ID，不可为空
- `updater_id` (BIGINT): 更新者ID
- `create_date_time` (TIMESTAMP): 创建时间，默认值为 '2022-10-08 00:00:00'
- `update_date_time` (TIMESTAMP): 更新时间

索引:
- `idx_holidays_holiday_date`: 假期日期索引
- `idx_holidays_holiday_type`: 假期类型索引
- `idx_holidays_country_code`: 国家代码索引
- `idx_holidays_is_recurring`: 是否循环索引
- `idx_holidays_create_date_time`: 创建时间倒序索引

## API 端点

所有端点都在 `/api/holidays` 路径下:

### 1. 获取假期列表（分页）
- **方法**: GET
- **路径**: `/api/holidays`
- **查询参数**:
  - `page` (可选): 页码，默认为 1
  - `page_size` (可选): 每页大小，默认为 10
  - `holiday_name` (可选): 假期名称模糊搜索
  - `holiday_type` (可选): 假期类型
  - `country_code` (可选): 国家代码
  - `is_recurring` (可选): 是否循环
  - `start_date` (可选): 开始日期
  - `end_date` (可选): 结束日期

### 2. 获取所有假期（不分页）
- **方法**: GET
- **路径**: `/api/holidays/all`
- **查询参数**: 同上（除了 page 和 page_size）

### 3. 根据ID获取假期
- **方法**: GET
- **路径**: `/api/holidays/{id}`

### 4. 创建假期
- **方法**: POST
- **路径**: `/api/holidays`
- **请求体**:
```json
{
  "holiday_name": "春节",
  "description": "中国传统新年",
  "holiday_date": "2026-01-29",
  "holiday_type": 1,
  "is_recurring": true,
  "country_code": 86
}
```

### 5. 更新假期
- **方法**: PUT
- **路径**: `/api/holidays/{id}`
- **请求体**: 所有字段都是可选的
```json
{
  "holiday_name": "春节",
  "description": "更新后的描述",
  "holiday_date": "2026-01-29",
  "holiday_type": 1,
  "is_recurring": true,
  "country_code": 86
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

## 模块结构

```
src/modules/holiday/
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


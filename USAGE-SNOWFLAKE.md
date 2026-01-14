# Snowflake ID 使用指南

## 🎯 推荐方式：全局初始化

**在应用启动时初始化一次，然后在整个应用中复用。**

### ✅ 优点

1. **保证一致性** - 整个应用使用相同的数据中心ID和机器ID
2. **线程安全** - 使用 `SnowflakeIdBucket` 内部有互斥锁保护
3. **性能优秀** - 避免重复创建生成器的开销
4. **便于管理** - 集中配置，易于维护

---

## 📝 配置方式

### 1. 环境变量配置（推荐）

在 `.env` 文件中添加：

```env
# Snowflake ID 生成器配置
SNOWFLAKE__DATACENTER_ID=1  # 数据中心ID (0-31)
SNOWFLAKE__MACHINE_ID=1     # 机器ID (0-31)
```

**注意**: 使用双下划线 `__` 分隔层级。

### 2. 默认配置

如果不设置环境变量，将使用默认值：
- `datacenter_id = 1`
- `machine_id = 1`

---

## 🚀 使用方式

### 在 Handler 中使用

#### 方式一：通过 AppState 使用（推荐）

```rust
use crate::common::app_state::AppState;
use crate::common::error::AppResult;
use crate::common::response::ApiResponse;
use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub email: String,
}

#[derive(Debug, Serialize)]
pub struct CreateUserResponse {
    pub id: String,
    pub username: String,
    pub email: String,
}

/// 创建用户 - 使用全局 ID 生成器
pub async fn create_user(
    State(state): State<AppState>,
    Json(request): Json<CreateUserRequest>,
) -> AppResult<(StatusCode, Json<ApiResponse<CreateUserResponse>>)> {
    // 生成用户ID
    let user_id = state.generate_id()
        .map_err(|e| AppError::InternalServerError(format!("生成ID失败: {}", e)))?;
    
    // 保存用户到数据库
    sqlx::query!(
        r#"
        INSERT INTO users (id, username, email, created_at)
        VALUES ($1, $2, $3, NOW())
        "#,
        user_id,
        request.username,
        request.email,
    )
    .execute(&state.pool)
    .await?;
    
    let response = CreateUserResponse {
        id: user_id.to_string(),
        username: request.username,
        email: request.email,
    };
    
    Ok((
        StatusCode::CREATED,
        Json(ApiResponse::success(response)),
    ))
}
```

#### 方式二：直接从 State 访问

```rust
pub async fn create_project(
    State(state): State<AppState>,
    Json(request): Json<CreateProjectRequest>,
) -> AppResult<(StatusCode, Json<ApiResponse<ProjectResponse>>)> {
    // 方式1: 使用便捷方法
    let project_id = state.generate_id()?;
    
    // 方式2: 直接访问 id_generator
    let task_id = state.id_generator.get_id()
        .map_err(|e| AppError::InternalServerError(format!("生成ID失败: {}", e)))?;
    
    // ... 其他业务逻辑
    
    Ok((StatusCode::CREATED, Json(ApiResponse::success(response))))
}
```

---

## 📦 完整示例

### 示例 1: 用户模块

```rust
// src/modules/user/handlers.rs
use crate::common::app_state::AppState;
use crate::common::error::{AppError, AppResult};
use axum::{extract::State, Json};

pub async fn create_user(
    State(state): State<AppState>,
    Json(request): Json<CreateUserRequest>,
) -> AppResult<Json<UserResponse>> {
    // 1. 生成用户ID
    let user_id = state.generate_id()?;
    
    // 2. 创建用户
    let user = sqlx::query_as!(
        User,
        r#"
        INSERT INTO users (id, username, email)
        VALUES ($1, $2, $3)
        RETURNING *
        "#,
        user_id,
        request.username,
        request.email,
    )
    .fetch_one(&state.pool)
    .await?;
    
    Ok(Json(UserResponse::from(user)))
}
```

### 示例 2: 订单模块

```rust
// src/modules/order/handlers.rs
use crate::common::app_state::AppState;
use axum::extract::State;

pub async fn create_order(
    State(state): State<AppState>,
    Json(request): Json<CreateOrderRequest>,
) -> AppResult<Json<OrderResponse>> {
    // 生成订单ID
    let order_id = state.generate_id()?;
    
    // 生成订单项ID
    let mut order_items = Vec::new();
    for item in request.items {
        let item_id = state.generate_id()?;
        order_items.push((item_id, item));
    }
    
    // 保存订单...
    
    Ok(Json(OrderResponse { id: order_id, items: order_items }))
}
```

### 示例 3: 项目模块（批量生成ID）

```rust
// src/modules/project/handlers.rs
use crate::common::app_state::AppState;

pub async fn create_project_with_tasks(
    State(state): State<AppState>,
    Json(request): Json<CreateProjectRequest>,
) -> AppResult<Json<ProjectResponse>> {
    // 生成项目ID
    let project_id = state.generate_id()?;
    
    // 为每个任务生成ID
    let task_ids: Result<Vec<i64>, _> = (0..request.tasks.len())
        .map(|_| state.generate_id())
        .collect();
    
    let task_ids = task_ids?;
    
    // 使用事务保存...
    let mut tx = state.pool.begin().await?;
    
    // 保存项目
    sqlx::query!(
        "INSERT INTO projects (id, name) VALUES ($1, $2)",
        project_id,
        request.name
    )
    .execute(&mut *tx)
    .await?;
    
    // 保存任务
    for (task_id, task) in task_ids.iter().zip(request.tasks.iter()) {
        sqlx::query!(
            "INSERT INTO tasks (id, project_id, title) VALUES ($1, $2, $3)",
            task_id,
            project_id,
            task.title
        )
        .execute(&mut *tx)
        .await?;
    }
    
    tx.commit().await?;
    
    Ok(Json(ProjectResponse { id: project_id, task_ids }))
}
```

---

## 🔧 ID 解析

解析已生成的 Snowflake ID：

```rust
use crate::common::snowflake::SnowflakeIdGenerator;

pub async fn get_id_info(id: i64) -> IdInfo {
    let (timestamp, datacenter_id, machine_id, sequence) = 
        SnowflakeIdGenerator::parse_id(id);
    
    IdInfo {
        id: id.to_string(),
        timestamp,
        datacenter_id,
        machine_id,
        sequence,
        created_at: chrono::DateTime::from_timestamp_millis(timestamp)
            .map(|dt| dt.to_rfc3339())
            .unwrap_or_default(),
    }
}
```

---

## ⚠️ 注意事项

### 1. 分布式环境配置

在分布式环境中，**每个节点必须有唯一的 datacenter_id 和 machine_id 组合**。

```bash
# 服务器 1
SNOWFLAKE__DATACENTER_ID=1
SNOWFLAKE__MACHINE_ID=1

# 服务器 2
SNOWFLAKE__DATACENTER_ID=1
SNOWFLAKE__MACHINE_ID=2

# 服务器 3
SNOWFLAKE__DATACENTER_ID=1
SNOWFLAKE__MACHINE_ID=3
```

### 2. ID 范围

- **数据中心ID**: 0-31 (5位)
- **机器ID**: 0-31 (5位)
- **总共可支持**: 32 × 32 = 1024 个节点

### 3. 性能

- **同一毫秒内最多生成**: 4096 个ID
- **每秒最多生成**: 约 409万 个ID
- **互斥锁开销**: 极小，推荐在所有场景使用

### 4. 时钟回拨

如果检测到系统时钟回拨，`generate_id()` 会返回错误。生产环境建议：
- 使用 NTP 时间同步
- 监控时钟回拨事件

---

## 🆚 对比：全局初始化 vs 局部初始化

| 特性 | 全局初始化（推荐） | 局部初始化 |
|------|-------------------|-----------|
| 性能 | ✅ 优秀 | ⚠️ 每次创建有开销 |
| 线程安全 | ✅ 是 | ⚠️ 需要手动处理 |
| 配置一致性 | ✅ 保证一致 | ❌ 可能不一致 |
| 代码复杂度 | ✅ 简单 | ⚠️ 需要传递或重复创建 |
| 推荐场景 | **所有场景** | 几乎没有 |

---

## 📚 总结

### 推荐做法

1. ✅ **全局初始化**: 在 `main.rs` 中创建 `SnowflakeIdBucket`，放入 `AppState`
2. ✅ **环境变量配置**: 通过 `.env` 配置数据中心ID和机器ID
3. ✅ **统一使用**: 在所有 handler 中通过 `State(state): State<AppState>` 访问
4. ✅ **便捷方法**: 使用 `state.generate_id()` 生成ID

### 不推荐做法

1. ❌ **局部初始化**: 在每个 handler 中创建新的生成器
2. ❌ **硬编码**: 直接在代码中写死 datacenter_id 和 machine_id
3. ❌ **不使用 AppState**: 通过其他方式传递生成器

---

## 🎉 快速开始

1. 配置环境变量（可选）
```bash
echo "SNOWFLAKE__DATACENTER_ID=1" >> .env
echo "SNOWFLAKE__MACHINE_ID=1" >> .env
```

2. 在 handler 中使用
```rust
pub async fn create_entity(
    State(state): State<AppState>,
    Json(request): Json<CreateRequest>,
) -> AppResult<Json<Response>> {
    let id = state.generate_id()?;
    // ... 使用 id
}
```

就这么简单！🚀


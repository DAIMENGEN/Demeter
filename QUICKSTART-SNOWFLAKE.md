# Snowflake ID 快速入门 🚀

## ✅ 已完成的配置

您的项目已经完成了 Snowflake ID 生成器的全局初始化配置！

### 📦 已实现的内容

1. ✅ **核心实现**: `src/common/snowflake.rs`
2. ✅ **全局状态**: `src/common/app_state.rs`
3. ✅ **配置支持**: `src/config/mod.rs`
4. ✅ **main.rs 初始化**: 应用启动时自动创建
5. ✅ **测试通过**: 所有测试运行正常

---

## 🎯 如何使用

### 步骤 1: 配置（可选）

在 `.env` 文件中添加：

```env
SNOWFLAKE__DATACENTER_ID=1
SNOWFLAKE__MACHINE_ID=1
```

> **注意**: 如果不配置，默认使用 datacenter_id=1, machine_id=1

### 步骤 2: 在代码中使用

#### 方式一：在 Handler 中使用（最常见）

```rust
use crate::common::app_state::AppState;
use axum::{extract::State, Json};

pub async fn create_user(
    State(state): State<AppState>,
    Json(request): Json<CreateUserRequest>,
) -> AppResult<Json<UserResponse>> {
    // 生成用户ID - 就这么简单！
    let user_id = state.generate_id()?;
    
    // 保存到数据库
    sqlx::query!(
        "INSERT INTO users (id, username) VALUES ($1, $2)",
        user_id,
        request.username
    )
    .execute(&state.pool)
    .await?;
    
    Ok(Json(UserResponse { id: user_id.to_string() }))
}
```

#### 方式二：批量生成ID

```rust
pub async fn create_project(
    State(state): State<AppState>,
) -> AppResult<Json<Response>> {
    // 生成项目ID
    let project_id = state.generate_id()?;
    
    // 生成多个任务ID
    let task_ids: Result<Vec<i64>, _> = (0..5)
        .map(|_| state.generate_id())
        .collect();
    
    let task_ids = task_ids?;
    
    // 使用生成的ID...
}
```

#### 方式三：在 Repository 中使用

```rust
pub struct UserRepository;

impl UserRepository {
    pub async fn create_user(
        state: &AppState,
        username: String,
    ) -> AppResult<i64> {
        let user_id = state.generate_id()?;
        
        sqlx::query!(
            "INSERT INTO users (id, username) VALUES ($1, $2)",
            user_id,
            username
        )
        .execute(&state.pool)
        .await?;
        
        Ok(user_id)
    }
}
```

---

## 💡 核心 API

### 生成ID

```rust
// 生成新的ID
let id = state.generate_id()?;

// 或者直接访问
let id = state.id_generator.get_id()?;
```

### 解析ID

```rust
use crate::common::snowflake::SnowflakeIdGenerator;

let (timestamp, datacenter_id, machine_id, sequence) = 
    SnowflakeIdGenerator::parse_id(id);

println!("ID: {}", id);
println!("时间戳: {}", timestamp);
println!("数据中心ID: {}", datacenter_id);
println!("机器ID: {}", machine_id);
println!("序列号: {}", sequence);
```

---

## 🔍 完整示例

### 创建用户示例

```rust
use crate::common::app_state::AppState;
use crate::common::error::AppResult;
use crate::common::response::ApiResponse;
use axum::{extract::State, http::StatusCode, Json};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub email: String,
}

#[derive(Serialize)]
pub struct UserResponse {
    pub id: String,
    pub username: String,
    pub email: String,
}

pub async fn create_user(
    State(state): State<AppState>,
    Json(request): Json<CreateUserRequest>,
) -> AppResult<(StatusCode, Json<ApiResponse<UserResponse>>)> {
    // 1. 生成用户ID
    let user_id = state.generate_id()?;
    
    // 2. 保存到数据库
    let user = sqlx::query!(
        r#"
        INSERT INTO users (id, username, email, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, username, email
        "#,
        user_id,
        request.username,
        request.email,
    )
    .fetch_one(&state.pool)
    .await?;
    
    // 3. 返回响应
    let response = UserResponse {
        id: user.id.to_string(),
        username: user.username,
        email: user.email,
    };
    
    Ok((StatusCode::CREATED, Json(ApiResponse::success(response))))
}
```

---

## ⚠️ 注意事项

### 1. 分布式环境

如果有多台服务器，每台服务器配置不同的 `machine_id`：

```bash
# 服务器 1
SNOWFLAKE__DATACENTER_ID=1
SNOWFLAKE__MACHINE_ID=1

# 服务器 2
SNOWFLAKE__DATACENTER_ID=1
SNOWFLAKE__MACHINE_ID=2
```

### 2. ID 范围

- 数据中心ID: 0-31
- 机器ID: 0-31
- 最多支持: 1024 个节点

### 3. 性能

- 同一毫秒最多生成: 4096 个ID
- 每秒最多生成: ~409万 个ID

### 4. 线程安全

- ✅ `SnowflakeIdBucket` 是线程安全的（已在 AppState 中使用）
- ✅ 可以在多个线程/请求中同时调用
- ✅ 内部使用互斥锁保护

---

## 📚 更多资源

- **详细文档**: `README-SNOWFLAKE.md` - API 文档
- **使用指南**: `USAGE-SNOWFLAKE.md` - 详细教程和最佳实践
- **完整示例**: `examples/snowflake_usage_complete.rs` - 6个实际场景示例
- **基础示例**: `examples/snowflake_examples.rs` - 简单示例

---

## ✅ 总结

### 三步使用法

1. **配置** - 在 `.env` 设置（可选，有默认值）
2. **注入** - 通过 `State(state): State<AppState>` 获取
3. **使用** - 调用 `state.generate_id()?`

### 一行代码生成ID

```rust
let id = state.generate_id()?;
```

就这么简单！🎉

---

## 🆘 常见问题

### Q1: 我需要在每个函数中创建生成器吗？

**A**: ❌ 不需要！已经在全局 AppState 中初始化好了，直接用 `state.generate_id()` 即可。

### Q2: 线程安全吗？

**A**: ✅ 是的！`SnowflakeIdBucket` 内部使用了互斥锁，完全线程安全。

### Q3: 性能如何？

**A**: ✅ 非常好！互斥锁开销极小，每秒可生成数百万ID。

### Q4: 需要配置数据库吗？

**A**: ❌ 不需要！Snowflake ID 完全在内存中生成，不依赖数据库。

### Q5: ID会重复吗？

**A**: ❌ 不会！只要每个节点的 datacenter_id + machine_id 组合是唯一的。

---

**开始使用吧！** 🚀


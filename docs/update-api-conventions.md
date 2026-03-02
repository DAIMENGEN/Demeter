# Update API 三态语义规范

本文档定义了 Demeter 项目中所有「更新」接口的字段语义规则。后端（Rust / Axum）与前端（TypeScript / React）均必须遵守此规范。在生成或修改任何更新相关代码时，**必须**按照本规范选择字段类型与序列化策略。

---

## 1. 核心原则：三态语义（Tri-State Semantics）

所有更新接口统一采用 **Patch 语义**，每个字段存在三种状态：

| 状态 | 含义 | JSON 表现 | 后端 Rust 类型 | 前端 TypeScript 类型 |
|------|------|-----------|---------------|---------------------|
| **未传** | 保持原值，不做任何修改 | 字段不出现在 JSON 中 | `None`（外层） | `undefined`（属性不存在） |
| **传 null** | 显式清空该字段 | `"field": null` | `Some(None)` | `null` |
| **传具体值** | 更新为该值 | `"field": "value"` | `Some(Some(v))` | 具体值 |

---

## 2. 后端 Rust 规范

### 2.1 字段类型选择规则

根据数据库列的 NULL 约束，选择不同的 Rust 类型：

#### 数据库 NOT NULL 列（不允许清空）

```rust
// 单层 Option：None = 不更新，Some(v) = 更新为 v
pub field_name: Option<T>,
```

适用于：`project_name`, `holiday_name`, `department_name`, `team_name`, `task_name`, `start_date_time`, `project_status`, `is_required` 等。

#### 数据库可 NULL 列（允许清空）

```rust
// 双层 Option + serde helper：
//   None = 不更新
//   Some(None) = 清空
//   Some(Some(v)) = 更新为 v
#[serde(default, deserialize_with = "crate::common::serde_helpers::double_option::deserialize")]
pub field_name: Option<Option<T>>,
```

适用于：`description`, `end_date_time`, `version`, `order`, `parent_id`, `default_value`, `options`, `value_color_map` 等。

### 2.2 `double_option` serde helper

位置：`src/common/serde_helpers.rs`

```rust
#[serde(default, deserialize_with = "crate::common::serde_helpers::double_option::deserialize")]
pub field: Option<Option<T>>,
```

- `#[serde(default)]` — 当 JSON 中字段未出现时，serde 不调用 deserialize，直接赋值为 `None`
- `deserialize_with` — 当 JSON 中字段出现时，调用 helper，返回 `Some(Option::<T>::deserialize(...))`

### 2.3 Update DTO 注释规范

每个 Update DTO 的可空字段应添加注释说明语义：

```rust
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateXxxParams {
    /// NOT NULL 字段
    pub name: Option<String>,
    /// 可空字段，双层 Option：None = 不更新，Some(None) = 清空，Some(Some(v)) = 更新
    #[serde(default, deserialize_with = "crate::common::serde_helpers::double_option::deserialize")]
    pub description: Option<Option<String>>,
}
```

### 2.4 Repository SQL 规范

**禁止**在更新 SQL 中对可空字段使用 `COALESCE`（它无法区分「未传」与「传 null」）。

使用 `sqlx::QueryBuilder` 动态构建 SET 子句：

```rust
pub async fn update_xxx(
    pool: &PgPool,
    id: i64,
    params: UpdateXxxParams,
    updater_id: i64,
) -> AppResult<Option<Xxx>> {
    let mut qb: QueryBuilder<sqlx::Postgres> = QueryBuilder::new("UPDATE table_name SET ");
    let mut has_set = false;

    // NOT NULL 字段：单层 Option
    if let Some(ref name) = params.name {
        qb.push("name = ");
        qb.push_bind(name.clone());
        has_set = true;
    }

    // 可空字段：双层 Option
    if let Some(ref desc_opt) = params.description {
        if has_set { qb.push(", "); }
        qb.push("description = ");
        qb.push_bind(desc_opt.clone());  // None → SQL NULL, Some(v) → v
        has_set = true;
    }

    // 始终更新 updater_id 和 update_date_time
    if has_set { qb.push(", "); }
    qb.push("updater_id = ");
    qb.push_bind(updater_id);
    qb.push(", update_date_time = CURRENT_TIMESTAMP WHERE id = ");
    qb.push_bind(id);
    qb.push(" RETURNING ...");

    let result = qb.build_query_as::<Xxx>().fetch_optional(pool).await?;
    Ok(result)
}
```

**关键点：**
- 只有字段「出现」时才 push 对应 SET 子句
- 对双层 Option 字段：`Some(None)` 绑定 SQL NULL，`Some(Some(v))` 绑定值
- 若无任何业务字段出现，仅更新 `updater_id` + `update_date_time`

### 2.5 关系字段语义（如 `department_id`, `team_ids`）

```
Option<Option<Id>>       → None: 不变 | Some(None): 清除关系 | Some(Some(id)): 设置关系
Option<Vec<Id>>          → None: 不变 | Some([]): 清空全部关系 | Some([..]): 重建为指定集合
```

### 2.6 NOT NULL 字段的 null 校验

若前端对 NOT NULL 字段显式传了 null，后端应在 handler 层返回 400 BadRequest：

```rust
// 示例：在 handler 中校验
if params.name.is_none() && /* 某些业务条件 */ {
    return Err(AppError::BadRequest("name cannot be null".to_string()));
}
```

> 注意：由于 NOT NULL 字段使用的是单层 `Option<T>`，serde 反序列化时 `null` 会变成 `None`，与「未传」相同，因此不会意外清空数据。这是一种安全的默认行为。

---

## 3. 前端 TypeScript 规范

### 3.1 Update 类型定义规则

#### NOT NULL 字段（不允许前端传 null）

```typescript
fieldName?: T;
// undefined (不传) → 保持原值
// 具体值 → 更新
```

#### 可 NULL 字段（允许前端传 null 清空）

```typescript
/** 可空字段：传 null 可清空 */
fieldName?: T | null;
// undefined (不传) → 保持原值
// null → 清空
// 具体值 → 更新
```

### 3.2 JSON 序列化行为

Axios + `JSON.stringify` 的默认行为天然支持三态：

```typescript
const params = {
  name: "new name",       // → JSON: "name": "new name"     → 后端 Some("new name")
  description: null,      // → JSON: "description": null     → 后端 Some(None) = 清空
  // endDateTime 未赋值   // → JSON 中不出现此字段           → 后端 None = 保持原值
};
```

> **重要**：`undefined` 属性会被 `JSON.stringify` 自动省略，这正是「不传 = 保持原值」的关键。

### 3.3 表单提交逻辑

构建更新参数时，需要区分「用户未修改」与「用户清空」：

```typescript
// ✅ 正确：用户清空了结束日期 → 发送 null 清空
endDateTime: endDate ? toNaiveDateTimeString(endDate) : null

// ❌ 错误：这会导致字段不出现在 JSON 中 → 后端保持原值
endDateTime: endDate ? toNaiveDateTimeString(endDate) : undefined
```

### 3.4 Update 接口类型定义注释规范

每个 Update 接口应包含三态语义说明：

```typescript
/**
 * 更新 Xxx 参数
 *
 * 三态语义（与后端 Patch 语义对齐）：
 * - 字段未传（undefined / 不出现）：保持原值
 * - 字段传 null：清空（仅允许可空列）
 * - 字段传具体值：更新为该值
 */
export interface UpdateXxxParams {
  name?: string;
  /** 可空字段：传 null 可清空 */
  description?: string | null;
}
```

---

## 4. 完整对照表（当前已实现的模块）

| 模块 | 可空字段（双层 Option / `T \| null`） | NOT NULL 字段（单层 Option / `T`） |
|------|------|------|
| **Project** | `description`, `end_date_time`, `version`, `order` | `project_name`, `start_date_time`, `project_status` |
| **TaskAttributeConfig** | `default_value`, `options`, `value_color_map`, `order` | `attribute_label`, `is_required` |
| **Task** | `parent_id` | `task_name`, `order`, `start_date_time`, `end_date_time`, `task_type`, `custom_attributes` |
| **Holiday** | `description` | `holiday_name`, `holiday_date`, `holiday_type` |
| **Department** | `description` | `department_name` |
| **Team** | `description` | `team_name` |
| **User** | `department_id` | `username`, `password`, `full_name`, `email`, `phone`, `is_active` |

---

## 5. 新增模块 Checklist

当新增模块或新增更新接口时，按以下步骤操作：

1. **确认字段的数据库 NULL 约束** → 决定使用单层 / 双层 Option
2. **定义 Update DTO**（Rust）→ 可空字段加 `#[serde(default, deserialize_with = "...")]`
3. **编写 Repository** → 使用 `QueryBuilder` 动态 SET，禁用 COALESCE
4. **定义前端 Update 类型**（TypeScript）→ 可空字段加 `| null`
5. **编写表单提交逻辑** → 用户清空时传 `null`，未修改时传 `undefined`
6. **回归测试** → 每个更新字段验证三组请求：未传、传 null、传具体值

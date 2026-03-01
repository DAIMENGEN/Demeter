# Backend Update API 统一语义改造清单

## 1. 目标语义（统一标准）

统一采用 Patch 语义（三态）：

- 字段未传：保持原值
- 字段传 null：清空（仅允许可空列）
- 字段传具体值：更新为该值

关系字段语义：

- Option<Vec<T>>
  - None：不变
  - Some([])：清空全部关系
  - Some([..])：重建为指定集合

错误约束：

- 对于数据库 NOT NULL 字段，若显式传 null，返回 400

---

## 2. 当前不一致点（优先修复）

### P0（高风险，行为突变）

1) Project 更新中 end_date_time 直接赋值

- 文件：[src/modules/business/project/repository.rs](../src/modules/business/project/repository.rs)
- 位置：update_project SQL 中 `end_date_time = $4`
- 问题：未传或传 null 都会把 end_date_time 清空
- 目标：改为三态语义（未传不变、null 清空、值更新）

2) Task Attribute Config 更新中 value_color_map 直接赋值

- 文件：[src/modules/business/project/task/repository.rs](../src/modules/business/project/task/repository.rs)
- 位置：update_attribute_config SQL 中 `value_color_map = $5`
- 问题：未传或传 null 都会清空
- 目标：改为三态语义

### P1（语义不完整，无法显式清空）

3) holiday/department/team/task 多数字段使用 Option<T> + COALESCE

- 文件：
  - [src/modules/holiday/models.rs](../src/modules/holiday/models.rs)
  - [src/modules/holiday/repository.rs](../src/modules/holiday/repository.rs)
  - [src/modules/organization/department/models.rs](../src/modules/organization/department/models.rs)
  - [src/modules/organization/department/repository.rs](../src/modules/organization/department/repository.rs)
  - [src/modules/organization/team/models.rs](../src/modules/organization/team/models.rs)
  - [src/modules/organization/team/repository.rs](../src/modules/organization/team/repository.rs)
  - [src/modules/business/project/task/models.rs](../src/modules/business/project/task/models.rs)
  - [src/modules/business/project/task/repository.rs](../src/modules/business/project/task/repository.rs)
- 问题：null 与未传都变成“不更新”，前端无法表达“清空可空字段”
- 目标：可空字段改双层 Option，SQL 改动态 SET

---

## 3. 改造策略（推荐分三期）

## Phase 1：先消除行为突变（低改动，快速收益）

只修 P0 两处，避免“未传即清空”。

- [src/modules/business/project/models.rs](../src/modules/business/project/models.rs)
  - end_date_time: Option<chrono::NaiveDateTime>
  - 改为双层 Option（serde double_option）
- [src/modules/business/project/repository.rs](../src/modules/business/project/repository.rs)
  - update_project 改动态 SQL（仅字段出现时才进入 SET）

- [src/modules/business/project/task/models.rs](../src/modules/business/project/task/models.rs)
  - value_color_map: Option<serde_json::Value>
  - 改为双层 Option
- [src/modules/business/project/task/repository.rs](../src/modules/business/project/task/repository.rs)
  - update_attribute_config 改动态 SQL

验收：

- 未传字段时，字段值保持不变
- 传 null 时，可空字段置 null
- 传具体值时，正确更新

## Phase 2：统一所有更新 DTO 三态表达

将所有“可空且允许清空”的更新字段，统一为双层 Option。

建议改造字段：

- Project
  - description, end_date_time, version, order
- Holiday
  - description
- Department
  - description
- Team
  - description
- Task
  - parent_id, custom_attributes（如果业务允许清空）
- Task Attribute Config
  - default_value, options, value_color_map, order（按业务约束决定是否允许清空）

不改双层 Option 的字段（保持 Option<T>）：

- NOT NULL 且不允许 null 的字段
  - 如 task_name, project_name, holiday_name 等

## Phase 3：统一更新 SQL 风格 + 接口契约文档

- 把更新 SQL 从 COALESCE 迁移为动态 SET（按字段是否出现构建）
- 每个更新 DTO 增加注释：None / Some(None) / Some(Some(v))
- 新增接口文档章节：Update 语义统一规范（请求 JSON 示例）

---

## 4. SQL 实现规范（建议模板）

使用 QueryBuilder 动态构建：

- 只有字段“出现”才 push 对应 SET 子句
- 对双层 Option 字段：
  - Some(None) -> 绑定 NULL
  - Some(Some(v)) -> 绑定值
- 若没有任何业务字段出现：
  - 可选择仅更新 updater_id + update_date_time
  - 或直接返回当前对象（推荐，减少无意义写入）

---

## 5. 路由和方法命名规范

当前状态：以 PUT 为主，batch-update 使用 POST。

建议：

- 保持现有路由不破坏兼容
- 文档中声明语义按 Patch 处理
- 后续可增补 PATCH 路由并逐步引导前端迁移

---

## 6. 回归测试清单（必须覆盖）

对每个更新接口，至少验证 3 组请求：

1) 字段未传（应不变）
2) 字段显式 null（可空字段应清空）
3) 字段传具体值（应更新）

重点接口：

- PUT /projects/{id}
- PUT /projects/{project_id}/task-attribute-configs/{config_id}
- PUT /users/{id}（作为标准样例，含双层 Option + 列表关系）

---

## 7. 推荐实施顺序（可直接开工）

1) 先改 Project end_date_time 与 TaskAttribute value_color_map（P0）
2) 再改 Holiday/Department/Team 的 description 三态
3) 最后统一 Task/Project 其余可空字段
4) 补充文档与回归用例

---

## 8. 风险与兼容说明

- 前端若曾依赖“未传即清空”的旧行为，Phase 1 后会改变结果（但这是修复）
- 若某字段数据库为 NOT NULL，不应允许 null，需在 handler 提前 400
- 批量更新接口（holiday batch-update）目前无法清空字段，若要支持清空需同步设计请求结构（可考虑双层 Option 或明确清空字段列表）

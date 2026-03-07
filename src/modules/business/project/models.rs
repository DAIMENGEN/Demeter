use crate::common::id::Id;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: Id,
    pub project_name: String,
    pub description: Option<String>,
    pub start_date_time: chrono::NaiveDateTime,
    pub end_date_time: Option<chrono::NaiveDateTime>,
    pub project_status: i32,
    pub version: Option<i32>,
    pub order: Option<f64>,
    /// 可见性: 0=private, 1=internal, 2=public
    pub visibility: i32,
    pub creator_id: Id,
    pub updater_id: Option<Id>,
    pub create_date_time: chrono::NaiveDateTime,
    pub update_date_time: Option<chrono::NaiveDateTime>,
    /// 当前用户在此项目中的角色（0=owner, 1=admin, 2=maintainer, 3=member, 4=viewer, null=无角色）
    /// 仅在特定查询中填充，其余场景默认 None
    #[sqlx(default)]
    pub my_role: Option<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectParams {
    pub project_name: String,
    pub description: Option<String>,
    pub start_date_time: chrono::NaiveDateTime,
    pub end_date_time: Option<chrono::NaiveDateTime>,
    pub project_status: i32,
    pub version: Option<i32>,
    pub order: Option<f64>,
    /// 可见性: 0=private(默认), 1=internal, 2=public
    pub visibility: Option<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProjectParams {
    /// NOT NULL 字段，Option<T>：None = 不更新，Some(v) = 更新
    pub project_name: Option<String>,
    /// 可空字段，双层 Option：None = 不更新，Some(None) = 清空，Some(Some(v)) = 更新
    #[serde(default, deserialize_with = "crate::common::serde_helpers::double_option::deserialize")]
    pub description: Option<Option<String>>,
    /// NOT NULL 字段
    pub start_date_time: Option<chrono::NaiveDateTime>,
    /// 可空字段，双层 Option：None = 不更新，Some(None) = 清空，Some(Some(v)) = 更新
    #[serde(default, deserialize_with = "crate::common::serde_helpers::double_option::deserialize")]
    pub end_date_time: Option<Option<chrono::NaiveDateTime>>,
    /// NOT NULL 字段
    pub project_status: Option<i32>,
    /// 可空字段，双层 Option
    #[serde(default, deserialize_with = "crate::common::serde_helpers::double_option::deserialize")]
    pub version: Option<Option<i32>>,
    /// 可空字段，双层 Option
    #[serde(default, deserialize_with = "crate::common::serde_helpers::double_option::deserialize")]
    pub order: Option<Option<f64>>,
    /// NOT NULL 字段
    pub visibility: Option<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectQueryParams {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
    pub project_name: Option<String>,
    pub project_status: Option<i32>,
    pub start_date_time: Option<chrono::NaiveDateTime>,
    pub end_date_time: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Deserialize)]
pub struct BatchDeleteProjectsParams {
    pub ids: Vec<Id>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReorderProjectsParams {
    pub project_ids: Vec<Id>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
#[allow(unused)]
pub struct ProjectVisit {
    pub id: Id,
    pub user_id: Id,
    pub project_id: Id,
    pub visited_at: chrono::NaiveDateTime,
    pub updater_id: Option<Id>,
    pub create_date_time: chrono::NaiveDateTime,
    pub update_date_time: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentlyVisitedQueryParams {
    pub limit: Option<i64>,
    pub project_name: Option<String>,
}

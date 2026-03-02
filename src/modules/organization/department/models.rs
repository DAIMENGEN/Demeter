use crate::common::id::Id;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Department {
    pub id: Id,
    pub department_name: String,
    pub description: Option<String>,
    pub creator_id: Id,
    pub updater_id: Option<Id>,
    pub create_date_time: chrono::NaiveDateTime,
    pub update_date_time: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDepartmentParams {
    pub department_name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDepartmentParams {
    /// NOT NULL 字段
    pub department_name: Option<String>,
    /// 可空字段，双层 Option：None = 不更新，Some(None) = 清空，Some(Some(v)) = 更新
    #[serde(default, deserialize_with = "crate::common::serde_helpers::double_option::deserialize")]
    pub description: Option<Option<String>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DepartmentQueryParams {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub department_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BatchDeleteDepartmentsParams {
    pub ids: Vec<Id>,
}

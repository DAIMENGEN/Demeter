use crate::common::id::Id;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// 部门数据模型
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

/// 创建部门请求参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDepartmentParams {
    pub department_name: String,
    pub description: Option<String>,
}

/// 更新部门请求参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDepartmentParams {
    pub department_name: Option<String>,
    pub description: Option<String>,
}

/// 部门查询参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DepartmentQueryParams {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub department_name: Option<String>,
}

/// 批量删除部门请求参数
#[derive(Debug, Deserialize)]
pub struct BatchDeleteDepartmentsParams {
    pub ids: Vec<Id>,
}

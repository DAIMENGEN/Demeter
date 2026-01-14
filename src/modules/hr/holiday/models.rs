use crate::common::id::Id;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// 假期数据模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Holiday {
    pub id: Id,
    pub holiday_name: String,
    pub description: Option<String>,
    pub holiday_date: chrono::NaiveDate,
    pub holiday_type: i32,
    pub is_recurring: bool,
    pub country_code: i32,
    pub creator_id: Id,
    pub updater_id: Option<Id>,
    pub create_date_time: chrono::NaiveDateTime,
    pub update_date_time: Option<chrono::NaiveDateTime>,
}

/// 创建假期请求参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateHolidayParams {
    pub holiday_name: String,
    pub description: Option<String>,
    pub holiday_date: chrono::NaiveDate,
    pub holiday_type: i32,
    #[serde(default)]
    pub is_recurring: Option<bool>,
    pub country_code: i32,
}

/// 更新假期请求参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateHolidayParams {
    pub holiday_name: Option<String>,
    pub description: Option<String>,
    pub holiday_date: Option<chrono::NaiveDate>,
    pub holiday_type: Option<i32>,
    pub is_recurring: Option<bool>,
    pub country_code: Option<i32>,
}

/// 假期查询参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HolidayQueryParams {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub holiday_name: Option<String>,
    pub holiday_type: Option<i32>,
    pub country_code: Option<i32>,
    pub is_recurring: Option<bool>,
    pub start_date: Option<chrono::NaiveDate>,
    pub end_date: Option<chrono::NaiveDate>,
}

/// 批量删除假期请求参数
#[derive(Debug, Deserialize)]
pub struct BatchDeleteHolidaysParams {
    pub ids: Vec<Id>,
}

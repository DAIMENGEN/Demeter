use crate::common::id::Id;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Holiday {
    pub id: Id,
    pub holiday_name: String,
    pub description: Option<String>,
    pub holiday_date: chrono::NaiveDate,
    pub holiday_type: i32,
    pub creator_id: Id,
    pub updater_id: Option<Id>,
    pub create_date_time: chrono::NaiveDateTime,
    pub update_date_time: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateHolidayParams {
    pub holiday_name: String,
    pub description: Option<String>,
    pub holiday_date: chrono::NaiveDate,
    pub holiday_type: i32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateHolidayParams {
    pub holiday_name: Option<String>,
    pub description: Option<String>,
    pub holiday_date: Option<chrono::NaiveDate>,
    pub holiday_type: Option<i32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HolidayQueryParams {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub holiday_name: Option<String>,
    pub holiday_type: Option<i32>,
    pub start_date: Option<chrono::NaiveDate>,
    pub end_date: Option<chrono::NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct BatchDeleteHolidaysParams {
    pub ids: Vec<Id>,
}

#[derive(Debug, Deserialize)]
pub struct BatchCreateHolidaysParams {
    pub holidays: Vec<CreateHolidayParams>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchUpdateHolidaysParams {
    pub ids: Vec<Id>,
    pub holiday_name: Option<String>,
    pub description: Option<String>,
    pub holiday_type: Option<i32>,
}

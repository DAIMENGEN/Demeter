use crate::common::id::Id;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AttributeType {
    Text,
    Number,
    Boolean,
    Date,
    DateTime,
    Select,
}

impl AttributeType {
    pub fn as_str(&self) -> &str {
        match self {
            AttributeType::Text => "text",
            AttributeType::Number => "number",
            AttributeType::Boolean => "boolean",
            AttributeType::Date => "date",
            AttributeType::DateTime => "datetime",
            AttributeType::Select => "select",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "text" => Some(AttributeType::Text),
            "number" => Some(AttributeType::Number),
            "boolean" => Some(AttributeType::Boolean),
            "date" => Some(AttributeType::Date),
            "datetime" => Some(AttributeType::DateTime),
            "select" => Some(AttributeType::Select),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(i32)]
pub enum TaskType {
    Unknown = 0,
    Default = 1,
    Milestone = 2,
    Checkpoint = 3,
}

impl TaskType {
    pub fn from_i32(v: i32) -> Self {
        match v {
            _ => TaskType::Unknown,
        }
    }

    pub fn as_i32(self) -> i32 {
        self as i32
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct TaskAttributeConfig {
    pub id: Id,
    pub project_id: Id,
    pub attribute_name: String,
    pub attribute_label: String,
    pub attribute_type: String,
    pub is_required: bool,
    pub default_value: Option<String>,
    #[sqlx(json)]
    pub options: Option<serde_json::Value>,
    #[sqlx(json)]
    pub value_color_map: Option<serde_json::Value>,
    pub order: Option<f64>,
    pub creator_id: Id,
    pub updater_id: Option<Id>,
    pub create_date_time: chrono::NaiveDateTime,
    pub update_date_time: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: Id,
    pub task_name: String,
    pub parent_id: Option<Id>,
    pub project_id: Id,
    pub order: f64,
    #[sqlx(json)]
    pub custom_attributes: serde_json::Value,
    pub start_date_time: chrono::NaiveDateTime,
    pub end_date_time: chrono::NaiveDateTime,
    pub task_type: i32,
    pub creator_id: Id,
    pub updater_id: Option<Id>,
    pub create_date_time: chrono::NaiveDateTime,
    pub update_date_time: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskAttributeConfigParams {
    pub attribute_name: String,
    pub attribute_label: String,
    pub attribute_type: String,
    pub is_required: bool,
    pub default_value: Option<String>,
    pub options: Option<serde_json::Value>,
    pub value_color_map: Option<serde_json::Value>,
    pub order: Option<f64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTaskAttributeConfigParams {
    pub attribute_label: Option<String>,
    pub is_required: Option<bool>,
    pub default_value: Option<String>,
    pub options: Option<serde_json::Value>,
    pub value_color_map: Option<serde_json::Value>,
    pub order: Option<f64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskParams {
    pub task_name: String,
    pub parent_id: Option<Id>,
    pub order: f64,
    pub start_date_time: chrono::NaiveDateTime,
    pub end_date_time: chrono::NaiveDateTime,
    pub task_type: i32,
    pub custom_attributes: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTaskParams {
    pub task_name: Option<String>,
    pub parent_id: Option<Id>,
    pub order: Option<f64>,
    pub start_date_time: Option<chrono::NaiveDateTime>,
    pub end_date_time: Option<chrono::NaiveDateTime>,
    pub task_type: Option<i32>,
    pub custom_attributes: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskQueryParams {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub task_name: Option<String>,
    pub parent_id: Option<Id>,
}

#[derive(Debug, Deserialize)]
pub struct BatchDeleteTasksParams {
    pub ids: Vec<Id>,
}

#[derive(Debug, Deserialize)]
pub struct BatchDeleteTaskAttributeConfigsParams {
    pub ids: Vec<Id>,
}

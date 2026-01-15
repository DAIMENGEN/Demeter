use crate::common::id::Id;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// 任务属性类型枚举
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

/// 任务类型（业务枚举）
///
/// 说明：数据库存储为 INT，API 传输也使用数字；该枚举用于代码语义化。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(i32)]
pub enum TaskType {
    /// 未指定/默认
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

/// 任务属性配置数据模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct TaskAttributeConfig {
    pub id: Id,
    pub project_id: Id,
    pub attribute_name: String,
    pub attribute_label: String,
    #[sqlx(rename = "attribute_type")]
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

/// 任务数据模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: Id,
    pub task_name: String,
    pub parent_id: Option<Id>,
    pub project_id: Id,
    pub order: Option<f64>,
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

/// 创建任务属性配置请求参数
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

/// 更新任务属性配置请求参数
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

/// 创建任务请求参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTaskParams {
    pub task_name: String,
    pub parent_id: Option<Id>,
    pub order: Option<f64>,
    pub start_date_time: chrono::NaiveDateTime,
    pub end_date_time: chrono::NaiveDateTime,
    pub task_type: i32,
    pub custom_attributes: Option<serde_json::Value>,
}

/// 更新任务请求参数
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

/// 任务查询参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskQueryParams {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub task_name: Option<String>,
    pub parent_id: Option<Id>,
}

/// 批量删除任务请求参数
#[derive(Debug, Deserialize)]
pub struct BatchDeleteTasksParams {
    pub ids: Vec<Id>,
}

/// 批量删除任务属性配置请求参数
#[derive(Debug, Deserialize)]
pub struct BatchDeleteTaskAttributeConfigsParams {
    pub ids: Vec<Id>,
}

/// 批量重排 tasks（同一 parentId 下），将 order 归一为 1..N
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReorderTasksParams {
    /// null 表示重排根任务
    pub parent_id: Option<Id>,
}

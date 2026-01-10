use serde::{Deserialize, Serialize};
use sqlx::FromRow;
/// 团队数据模型
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Team {
    pub id: i64,
    pub team_name: String,
    pub description: Option<String>,
    pub creator_id: i64,
    pub updater_id: Option<i64>,
    pub create_date_time: chrono::NaiveDateTime,
    pub update_date_time: Option<chrono::NaiveDateTime>,
}
/// 创建团队请求参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTeamParams {
    pub team_name: String,
    pub description: Option<String>,
}
/// 更新团队请求参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTeamParams {
    pub team_name: Option<String>,
    pub description: Option<String>,
}
/// 团队查询参数
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TeamQueryParams {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub team_name: Option<String>,
}
/// 批量删除团队请求参数
#[derive(Debug, Deserialize)]
pub struct BatchDeleteTeamsParams {
    pub ids: Vec<i64>,
}

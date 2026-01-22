use crate::common::id::Id;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Team {
    pub id: Id,
    pub team_name: String,
    pub description: Option<String>,
    pub creator_id: Id,
    pub updater_id: Option<Id>,
    pub create_date_time: chrono::NaiveDateTime,
    pub update_date_time: Option<chrono::NaiveDateTime>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTeamParams {
    pub team_name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTeamParams {
    pub team_name: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TeamQueryParams {
    pub page: Option<i64>,
    pub page_size: Option<i64>,
    pub team_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BatchDeleteTeamsParams {
    pub ids: Vec<Id>,
}

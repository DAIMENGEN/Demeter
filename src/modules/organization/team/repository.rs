use crate::common::error::AppResult;
use crate::modules::organization::team::models::{
    CreateTeamParams, Team, TeamQueryParams, UpdateTeamParams,
};
use sqlx::PgPool;
/// 团队数据访问层
pub struct TeamRepository;
impl TeamRepository {
    /// 获取团队列表（分页）
    pub async fn get_team_list(
        pool: &PgPool,
        params: TeamQueryParams,
    ) -> AppResult<(Vec<Team>, i64)> {
        let page = params.page.unwrap_or(1);
        let page_size = params.page_size.unwrap_or(10);
        let offset = (page - 1) * page_size;
        // 构建查询条件
        let mut query = String::from(
            "SELECT id, team_name, description, creator_id, updater_id, create_date_time, update_date_time
             FROM teams WHERE 1=1",
        );
        let mut count_query = String::from("SELECT COUNT(*) FROM teams WHERE 1=1");
        if let Some(team_name) = &params.team_name {
            query.push_str(&format!(
                " AND team_name ILIKE '%{}%'",
                team_name
            ));
            count_query.push_str(&format!(
                " AND team_name ILIKE '%{}%'",
                team_name
            ));
        }
        query.push_str(&format!(
            " ORDER BY create_date_time DESC LIMIT {} OFFSET {}",
            page_size, offset
        ));
        let teams = sqlx::query_as::<_, Team>(&query)
            .fetch_all(pool)
            .await?;
        let total: (i64,) = sqlx::query_as(&count_query).fetch_one(pool).await?;
        Ok((teams, total.0))
    }
    /// 获取所有团队（不分页）
    pub async fn get_all_teams(
        pool: &PgPool,
        params: TeamQueryParams,
    ) -> AppResult<Vec<Team>> {
        let mut query = String::from(
            "SELECT id, team_name, description, creator_id, updater_id, create_date_time, update_date_time
             FROM teams WHERE 1=1",
        );
        if let Some(team_name) = &params.team_name {
            query.push_str(&format!(
                " AND team_name ILIKE '%{}%'",
                team_name
            ));
        }
        query.push_str(" ORDER BY create_date_time DESC");
        let teams = sqlx::query_as::<_, Team>(&query)
            .fetch_all(pool)
            .await?;
        Ok(teams)
    }
    /// 根据 ID 获取团队
    pub async fn get_team_by_id(
        pool: &PgPool,
        id: i64,
    ) -> AppResult<Option<Team>> {
        let team = sqlx::query_as::<_, Team>(
            r#"
            SELECT id, team_name, description, creator_id, updater_id, create_date_time, update_date_time
            FROM teams
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;
        Ok(team)
    }
    /// 根据团队名称获取团队
    pub async fn get_team_by_name(
        pool: &PgPool,
        team_name: &str,
    ) -> AppResult<Option<Team>> {
        let team = sqlx::query_as::<_, Team>(
            r#"
            SELECT id, team_name, description, creator_id, updater_id, create_date_time, update_date_time
            FROM teams
            WHERE team_name = $1
            "#,
        )
        .bind(team_name)
        .fetch_optional(pool)
        .await?;
        Ok(team)
    }
    /// 创建团队
    pub async fn create_team(
        pool: &PgPool,
        params: CreateTeamParams,
        creator_id: i64,
    ) -> AppResult<Team> {
        let team = sqlx::query_as::<_, Team>(
            r#"
            INSERT INTO teams (team_name, description, creator_id, create_date_time)
            VALUES ($1, $2, $3, NOW())
            RETURNING id, team_name, description, creator_id, updater_id, create_date_time, update_date_time
            "#
        )
        .bind(&params.team_name)
        .bind(&params.description)
        .bind(creator_id)
        .fetch_one(pool)
        .await?;
        Ok(team)
    }
    /// 更新团队
    pub async fn update_team(
        pool: &PgPool,
        id: i64,
        params: UpdateTeamParams,
        updater_id: i64,
    ) -> AppResult<Option<Team>> {
        // 首先检查团队是否存在
        let existing = Self::get_team_by_id(pool, id).await?;
        if existing.is_none() {
            return Ok(None);
        }
        let team = sqlx::query_as::<_, Team>(
            r#"
            UPDATE teams
            SET team_name = COALESCE($2, team_name),
                description = COALESCE($3, description),
                updater_id = $4,
                update_date_time = NOW()
            WHERE id = $1
            RETURNING id, team_name, description, creator_id, updater_id, create_date_time, update_date_time
            "#
        )
        .bind(id)
        .bind(&params.team_name)
        .bind(&params.description)
        .bind(updater_id)
        .fetch_one(pool)
        .await?;
        Ok(Some(team))
    }
    /// 删除团队
    pub async fn delete_team(pool: &PgPool, id: i64) -> AppResult<bool> {
        let result = sqlx::query(
            r#"
            DELETE FROM teams
            WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;
        Ok(result.rows_affected() > 0)
    }
    /// 批量删除团队
    pub async fn batch_delete_teams(pool: &PgPool, ids: Vec<i64>) -> AppResult<u64> {
        let result = sqlx::query(
            r#"
            DELETE FROM teams
            WHERE id = ANY($1)
            "#,
        )
        .bind(&ids)
        .execute(pool)
        .await?;
        Ok(result.rows_affected())
    }
}

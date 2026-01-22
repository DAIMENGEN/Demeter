use crate::common::error::AppResult;
use crate::modules::organization::team::models::{
    CreateTeamParams, Team, TeamQueryParams, UpdateTeamParams,
};
use sqlx::PgPool;

pub struct TeamRepository;

impl TeamRepository {
    pub async fn get_team_list(
        pool: &PgPool,
        params: TeamQueryParams,
    ) -> AppResult<(Vec<Team>, i64)> {
        let page = params.page.unwrap_or(1);
        let page_size = params.page_size.unwrap_or(10);
        let offset = (page - 1) * page_size;
        let team_name_pattern = params.team_name.as_ref().map(|t| format!("%{}%", t));
        let teams = sqlx::query_as::<_, Team>(
            r#"
            SELECT 
                id,
                team_name,
                description,
                creator_id,
                updater_id,
                create_date_time,
                update_date_time
            FROM teams
            WHERE ($1::TEXT IS NULL OR team_name ILIKE $1)
            ORDER BY create_date_time DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(&team_name_pattern)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        let total: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*)
            FROM teams
            WHERE ($1::TEXT IS NULL OR team_name ILIKE $1)
            "#,
        )
        .bind(&team_name_pattern)
        .fetch_one(pool)
        .await?;

        Ok((teams, total.0))
    }

    pub async fn get_all_teams(pool: &PgPool, params: TeamQueryParams) -> AppResult<Vec<Team>> {
        let team_name_pattern = params.team_name.as_ref().map(|t| format!("%{}%", t));

        let teams = sqlx::query_as::<_, Team>(
            r#"
            SELECT id, team_name, description, creator_id, updater_id, create_date_time, update_date_time
            FROM teams
            WHERE ($1::TEXT IS NULL OR team_name ILIKE $1)
            ORDER BY create_date_time DESC
            "#,
        )
        .bind(&team_name_pattern)
        .fetch_all(pool)
        .await?;

        Ok(teams)
    }

    pub async fn get_team_by_id(pool: &PgPool, team_id: i64) -> AppResult<Option<Team>> {
        let team = sqlx::query_as::<_, Team>(
            r#"
            SELECT id, team_name, description, creator_id, updater_id, create_date_time, update_date_time
            FROM teams
            WHERE id = $1
            "#,
        )
        .bind(team_id)
        .fetch_optional(pool)
        .await?;
        Ok(team)
    }

    pub async fn get_team_by_name(pool: &PgPool, team_name: &str) -> AppResult<Option<Team>> {
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

    pub async fn create_team(
        pool: &PgPool,
        team_id: i64,
        params: CreateTeamParams,
        creator_id: i64,
    ) -> AppResult<Team> {
        let team = sqlx::query_as::<_, Team>(
            r#"
            INSERT INTO teams (id, team_name, description, creator_id, create_date_time)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id, team_name, description, creator_id, updater_id, create_date_time, update_date_time
            "#
        )
        .bind(team_id)
        .bind(&params.team_name)
        .bind(&params.description)
        .bind(creator_id)
        .fetch_one(pool)
        .await?;
        Ok(team)
    }

    pub async fn update_team(
        pool: &PgPool,
        team_id: i64,
        params: UpdateTeamParams,
        updater_id: i64,
    ) -> AppResult<Option<Team>> {
        let existing = Self::get_team_by_id(pool, team_id).await?;
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
        .bind(team_id)
        .bind(&params.team_name)
        .bind(&params.description)
        .bind(updater_id)
        .fetch_one(pool)
        .await?;
        Ok(Some(team))
    }

    pub async fn delete_team(pool: &PgPool, team_id: i64) -> AppResult<bool> {
        let result = sqlx::query(
            r#"
            DELETE FROM teams
            WHERE id = $1
            "#,
        )
        .bind(team_id)
        .execute(pool)
        .await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn batch_delete_teams(pool: &PgPool, team_ids: Vec<i64>) -> AppResult<u64> {
        let result = sqlx::query(
            r#"
            DELETE FROM teams
            WHERE id = ANY($1)
            "#,
        )
        .bind(&team_ids)
        .execute(pool)
        .await?;
        Ok(result.rows_affected())
    }
}

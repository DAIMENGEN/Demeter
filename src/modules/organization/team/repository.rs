use crate::common::error::AppResult;
use crate::modules::organization::team::models::{
    CreateTeamParams, Team, TeamQueryParams, UpdateTeamParams,
};
use sqlx::PgPool;
use sqlx::QueryBuilder;

pub struct TeamRepository;

/// teams 表 SELECT 列
const TEAM_COLUMNS: &str = "id, team_name, description, creator_id, updater_id, create_date_time, update_date_time";

/// teams 表 RETURNING 列
const TEAM_RETURNING: &str = " RETURNING id, team_name, description, creator_id, updater_id, create_date_time, update_date_time";

impl TeamRepository {
    pub async fn get_team_list(
        pool: &PgPool,
        params: TeamQueryParams,
    ) -> AppResult<(Vec<Team>, i64)> {
        let page = params.page.unwrap_or(1);
        let page_size = params.per_page.unwrap_or(10);
        let offset = (page - 1) * page_size;
        let team_name_pattern = params.team_name.as_ref().map(|t| format!("%{}%", t));
        let teams = sqlx::query_as::<_, Team>(
            &format!(
                r#"
                SELECT {}
                FROM teams
                WHERE ($1::TEXT IS NULL OR team_name ILIKE $1)
                ORDER BY create_date_time DESC
                LIMIT $2 OFFSET $3
                "#,
                TEAM_COLUMNS,
            ),
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
            &format!(
                r#"
                SELECT {}
                FROM teams
                WHERE ($1::TEXT IS NULL OR team_name ILIKE $1)
                ORDER BY create_date_time DESC
                "#,
                TEAM_COLUMNS,
            ),
        )
        .bind(&team_name_pattern)
        .fetch_all(pool)
        .await?;

        Ok(teams)
    }

    pub async fn get_team_by_id(pool: &PgPool, team_id: i64) -> AppResult<Option<Team>> {
        let team = sqlx::query_as::<_, Team>(
            &format!("SELECT {} FROM teams WHERE id = $1", TEAM_COLUMNS),
        )
        .bind(team_id)
        .fetch_optional(pool)
        .await?;
        Ok(team)
    }

    pub async fn get_team_by_name(pool: &PgPool, team_name: &str) -> AppResult<Option<Team>> {
        let team = sqlx::query_as::<_, Team>(
            &format!("SELECT {} FROM teams WHERE team_name = $1", TEAM_COLUMNS),
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
        let sql = format!(
            "INSERT INTO teams (id, team_name, description, creator_id, create_date_time) \
             VALUES ($1, $2, $3, $4, NOW()){}",
            TEAM_RETURNING,
        );
        let team = sqlx::query_as::<_, Team>(&sql)
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
        // 动态构建 SET 子句
        let mut qb: QueryBuilder<sqlx::Postgres> = QueryBuilder::new("UPDATE teams SET ");
        let mut has_set = false;

        // NOT NULL 字段
        if let Some(ref name) = params.team_name {
            qb.push("team_name = ");
            qb.push_bind(name.clone());
            has_set = true;
        }

        // 可空字段：双层 Option
        if let Some(ref desc_opt) = params.description {
            if has_set { qb.push(", "); }
            qb.push("description = ");
            qb.push_bind(desc_opt.clone());
            has_set = true;
        }

        if has_set { qb.push(", "); }
        qb.push("updater_id = ");
        qb.push_bind(updater_id);
        qb.push(", update_date_time = NOW() WHERE id = ");
        qb.push_bind(team_id);
        qb.push(TEAM_RETURNING);

        let team = qb
            .build_query_as::<Team>()
            .fetch_optional(pool)
            .await?;

        Ok(team)
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

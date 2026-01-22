use crate::common::error::AppResult;
use crate::modules::hr::holiday::models::{
    CreateHolidayParams, Holiday, HolidayQueryParams, UpdateHolidayParams,
};
use sqlx::PgPool;

pub struct HolidayRepository;

impl HolidayRepository {
    pub async fn get_holiday_list(
        pool: &PgPool,
        params: HolidayQueryParams,
    ) -> AppResult<(Vec<Holiday>, i64)> {
        let page = params.page.unwrap_or(1);
        let page_size = params.page_size.unwrap_or(10);
        let offset = (page - 1) * page_size;
        let holiday_name_pattern = params.holiday_name.as_ref().map(|h| format!("%{}%", h));
        let holidays = sqlx::query_as::<_, Holiday>(
            r#"
            SELECT id, holiday_name, description, holiday_date, holiday_type,
                   creator_id, updater_id, create_date_time, update_date_time
            FROM holidays
            WHERE ($1::TEXT IS NULL OR holiday_name ILIKE $1)
              AND ($2::SMALLINT IS NULL OR holiday_type = $2)
              AND ($3::DATE IS NULL OR holiday_date >= $3)
              AND ($4::DATE IS NULL OR holiday_date <= $4)
            ORDER BY holiday_date DESC
            LIMIT $5 OFFSET $6
            "#,
        )
        .bind(&holiday_name_pattern)
        .bind(params.holiday_type)
        .bind(params.start_date)
        .bind(params.end_date)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        let total: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*)
            FROM holidays
            WHERE ($1::TEXT IS NULL OR holiday_name ILIKE $1)
              AND ($2::SMALLINT IS NULL OR holiday_type = $2)
              AND ($3::DATE IS NULL OR holiday_date >= $3)
              AND ($4::DATE IS NULL OR holiday_date <= $4)
            "#,
        )
        .bind(&holiday_name_pattern)
        .bind(params.holiday_type)
        .bind(params.start_date)
        .bind(params.end_date)
        .fetch_one(pool)
        .await?;

        Ok((holidays, total.0))
    }

    pub async fn get_all_holidays(
        pool: &PgPool,
        params: HolidayQueryParams,
    ) -> AppResult<Vec<Holiday>> {
        let holiday_name_pattern = params.holiday_name.as_ref().map(|h| format!("%{}%", h));

        let holidays = sqlx::query_as::<_, Holiday>(
            r#"
            SELECT id, holiday_name, description, holiday_date, holiday_type,
                   creator_id, updater_id, create_date_time, update_date_time
            FROM holidays
            WHERE ($1::TEXT IS NULL OR holiday_name ILIKE $1)
              AND ($2::SMALLINT IS NULL OR holiday_type = $2)
              AND ($3::DATE IS NULL OR holiday_date >= $3)
              AND ($4::DATE IS NULL OR holiday_date <= $4)
            ORDER BY holiday_date DESC
            "#,
        )
        .bind(&holiday_name_pattern)
        .bind(params.holiday_type)
        .bind(params.start_date)
        .bind(params.end_date)
        .fetch_all(pool)
        .await?;

        Ok(holidays)
    }

    pub async fn get_holiday_by_id(pool: &PgPool, holiday_id: i64) -> AppResult<Option<Holiday>> {
        let holiday = sqlx::query_as::<_, Holiday>(
            r#"
            SELECT id, holiday_name, description, holiday_date, holiday_type,
                   creator_id, updater_id, create_date_time, update_date_time
            FROM holidays
            WHERE id = $1
            "#,
        )
        .bind(holiday_id)
        .fetch_optional(pool)
        .await?;

        Ok(holiday)
    }

    pub async fn create_holiday(
        pool: &PgPool,
        holiday_id: i64,
        params: CreateHolidayParams,
        creator_id: i64,
    ) -> AppResult<Holiday> {
        let holiday = sqlx::query_as::<_, Holiday>(
            r#"
            INSERT INTO holidays (id, holiday_name, description, holiday_date, holiday_type,
                                creator_id, create_date_time)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING id, holiday_name, description, holiday_date, holiday_type,
                      creator_id, updater_id, create_date_time, update_date_time
            "#,
        )
        .bind(holiday_id)
        .bind(&params.holiday_name)
        .bind(&params.description)
        .bind(params.holiday_date)
        .bind(params.holiday_type)
        .bind(creator_id)
        .fetch_one(pool)
        .await?;

        Ok(holiday)
    }

    pub async fn update_holiday(
        pool: &PgPool,
        holiday_id: i64,
        params: UpdateHolidayParams,
        updater_id: i64,
    ) -> AppResult<Option<Holiday>> {
        let existing = Self::get_holiday_by_id(pool, holiday_id).await?;
        if existing.is_none() {
            return Ok(None);
        }

        let holiday = sqlx::query_as::<_, Holiday>(
            r#"
            UPDATE holidays
            SET holiday_name = COALESCE($2, holiday_name),
                description = COALESCE($3, description),
                holiday_date = COALESCE($4, holiday_date),
                holiday_type = COALESCE($5, holiday_type),
                updater_id = $6,
                update_date_time = NOW()
            WHERE id = $1
            RETURNING id, holiday_name, description, holiday_date, holiday_type,
                      creator_id, updater_id, create_date_time, update_date_time
            "#,
        )
        .bind(holiday_id)
        .bind(&params.holiday_name)
        .bind(&params.description)
        .bind(params.holiday_date)
        .bind(params.holiday_type)
        .bind(updater_id)
        .fetch_one(pool)
        .await?;

        Ok(Some(holiday))
    }

    pub async fn delete_holiday(pool: &PgPool, holiday_id: i64) -> AppResult<bool> {
        let result = sqlx::query("DELETE FROM holidays WHERE id = $1")
            .bind(holiday_id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn batch_delete_holidays(pool: &PgPool, holiday_ids: Vec<i64>) -> AppResult<u64> {
        let result = sqlx::query(
            r#"
            DELETE FROM holidays
            WHERE id = ANY($1)
            "#,
        )
        .bind(&holiday_ids)
        .execute(pool)
        .await?;

        Ok(result.rows_affected())
    }

    pub async fn batch_create_holidays(
        pool: &PgPool,
        holiday_ids: Vec<i64>,
        params: Vec<CreateHolidayParams>,
        creator_id: i64,
    ) -> AppResult<Vec<Holiday>> {
        let mut holidays = Vec::new();

        for (idx, param) in params.into_iter().enumerate() {
            let holiday_id = holiday_ids[idx];

            let holiday = sqlx::query_as::<_, Holiday>(
                r#"
                INSERT INTO holidays (id, holiday_name, description, holiday_date, holiday_type,
                                    creator_id, create_date_time)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING id, holiday_name, description, holiday_date, holiday_type,
                          creator_id, updater_id, create_date_time, update_date_time
                "#,
            )
            .bind(holiday_id)
            .bind(&param.holiday_name)
            .bind(&param.description)
            .bind(param.holiday_date)
            .bind(param.holiday_type)
            .bind(creator_id)
            .fetch_one(pool)
            .await?;

            holidays.push(holiday);
        }

        Ok(holidays)
    }
}

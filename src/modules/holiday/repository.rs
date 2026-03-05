use crate::common::error::AppResult;
use crate::modules::holiday::models::{
    CreateHolidayParams, Holiday, HolidayQueryParams, UpdateHolidayParams,
};
use sqlx::PgPool;
use sqlx::QueryBuilder;

pub struct HolidayRepository;

/// holidays 表 SELECT 列
const HOLIDAY_COLUMNS: &str = "id, holiday_name, description, holiday_date, holiday_type, \
    creator_id, updater_id, create_date_time, update_date_time";

/// holidays 表 RETURNING 列
const HOLIDAY_RETURNING: &str = " RETURNING id, holiday_name, description, holiday_date, holiday_type, \
    creator_id, updater_id, create_date_time, update_date_time";

impl HolidayRepository {
    pub async fn get_holiday_list(
        pool: &PgPool,
        params: HolidayQueryParams,
    ) -> AppResult<(Vec<Holiday>, i64)> {
        let page = params.page.unwrap_or(1);
        let page_size = params.per_page.unwrap_or(10);
        let offset = (page - 1) * page_size;
        let holiday_name_pattern = params.holiday_name.as_ref().map(|h| format!("%{}%", h));
        let holidays = sqlx::query_as::<_, Holiday>(
            &format!(
                r#"
                SELECT {}
                FROM holidays
                WHERE ($1::TEXT IS NULL OR holiday_name ILIKE $1)
                  AND ($2::SMALLINT IS NULL OR holiday_type = $2)
                  AND ($3::DATE IS NULL OR holiday_date >= $3)
                  AND ($4::DATE IS NULL OR holiday_date <= $4)
                ORDER BY holiday_date DESC
                LIMIT $5 OFFSET $6
                "#,
                HOLIDAY_COLUMNS,
            ),
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
            &format!(
                r#"
                SELECT {}
                FROM holidays
                WHERE ($1::TEXT IS NULL OR holiday_name ILIKE $1)
                  AND ($2::SMALLINT IS NULL OR holiday_type = $2)
                  AND ($3::DATE IS NULL OR holiday_date >= $3)
                  AND ($4::DATE IS NULL OR holiday_date <= $4)
                ORDER BY holiday_date DESC
                "#,
                HOLIDAY_COLUMNS,
            ),
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
            &format!(
                "SELECT {} FROM holidays WHERE id = $1",
                HOLIDAY_COLUMNS,
            ),
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
        let sql = format!(
            "INSERT INTO holidays (id, holiday_name, description, holiday_date, holiday_type, \
             creator_id, create_date_time) \
             VALUES ($1, $2, $3, $4, $5, $6, NOW()){}",
            HOLIDAY_RETURNING,
        );
        let holiday = sqlx::query_as::<_, Holiday>(&sql)
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
        // 动态构建 SET 子句
        let mut qb: QueryBuilder<sqlx::Postgres> = QueryBuilder::new("UPDATE holidays SET ");
        let mut has_set = false;

        // NOT NULL 字段
        if let Some(ref name) = params.holiday_name {
            qb.push("holiday_name = ");
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

        // NOT NULL 字段
        if let Some(ref date) = params.holiday_date {
            if has_set { qb.push(", "); }
            qb.push("holiday_date = ");
            qb.push_bind(*date);
            has_set = true;
        }

        if let Some(ref h_type) = params.holiday_type {
            if has_set { qb.push(", "); }
            qb.push("holiday_type = ");
            qb.push_bind(*h_type);
            has_set = true;
        }

        if has_set { qb.push(", "); }
        qb.push("updater_id = ");
        qb.push_bind(updater_id);
        qb.push(", update_date_time = NOW() WHERE id = ");
        qb.push_bind(holiday_id);
        qb.push(HOLIDAY_RETURNING);

        let holiday = qb
            .build_query_as::<Holiday>()
            .fetch_optional(pool)
            .await?;

        Ok(holiday)
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
        if holiday_ids.is_empty() {
            return Ok(vec![]);
        }

        let mut qb: QueryBuilder<sqlx::Postgres> = QueryBuilder::new(
            "INSERT INTO holidays (id, holiday_name, description, holiday_date, holiday_type, \
             creator_id, create_date_time) ",
        );

        qb.push_values(
            holiday_ids.iter().zip(params.iter()),
            |mut b, (id, param)| {
                b.push_bind(*id)
                    .push_bind(param.holiday_name.clone())
                    .push_bind(param.description.clone())
                    .push_bind(param.holiday_date)
                    .push_bind(param.holiday_type)
                    .push_bind(creator_id)
                    .push("NOW()");
            },
        );

        qb.push(HOLIDAY_RETURNING);

        let holidays = qb.build_query_as::<Holiday>().fetch_all(pool).await?;

        Ok(holidays)
    }

    pub async fn batch_update_holidays(
        pool: &PgPool,
        holiday_ids: Vec<i64>,
        holiday_name: Option<String>,
        description: Option<String>,
        holiday_type: Option<i32>,
        updater_id: i64,
    ) -> AppResult<Vec<Holiday>> {
        if holiday_ids.is_empty() {
            return Ok(vec![]);
        }

        // Build dynamic UPDATE query
        let mut qb: QueryBuilder<sqlx::Postgres> = QueryBuilder::new("UPDATE holidays SET ");
        let mut has_set = false;

        if let Some(ref name) = holiday_name {
            qb.push("holiday_name = ");
            qb.push_bind(name.clone());
            has_set = true;
        }

        if let Some(ref desc) = description {
            if has_set {
                qb.push(", ");
            }
            qb.push("description = ");
            qb.push_bind(desc.clone());
            has_set = true;
        }

        if let Some(h_type) = holiday_type {
            if has_set {
                qb.push(", ");
            }
            qb.push("holiday_type = ");
            qb.push_bind(h_type);
            has_set = true;
        }

        if !has_set {
            // Nothing to update, just return current holidays
            let holidays = sqlx::query_as::<_, Holiday>(
                &format!(
                    "SELECT {} FROM holidays WHERE id = ANY($1) ORDER BY holiday_date",
                    HOLIDAY_COLUMNS,
                ),
            )
            .bind(&holiday_ids)
            .fetch_all(pool)
            .await?;
            return Ok(holidays);
        }

        qb.push(", updater_id = ");
        qb.push_bind(updater_id);
        qb.push(", update_date_time = NOW() WHERE id = ANY(");
        qb.push_bind(&holiday_ids);
        qb.push(") ");
        qb.push(HOLIDAY_RETURNING);

        let holidays = qb
            .build_query_as::<Holiday>()
            .fetch_all(pool)
            .await?;

        Ok(holidays)
    }
}

use crate::common::error::AppResult;
use crate::modules::hr::holiday::models::{
    CreateHolidayParams, Holiday, HolidayQueryParams, UpdateHolidayParams,
};
use sqlx::PgPool;

/// 假期数据访问层
pub struct HolidayRepository;

impl HolidayRepository {
    /// 获取假期列表（分页）
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
                   country_code, creator_id, updater_id, create_date_time, update_date_time
            FROM holidays
            WHERE ($1::TEXT IS NULL OR holiday_name ILIKE $1)
              AND ($2::SMALLINT IS NULL OR holiday_type = $2)
              AND ($3::SMALLINT IS NULL OR country_code = $3)
              AND ($4::DATE IS NULL OR holiday_date >= $4)
              AND ($5::DATE IS NULL OR holiday_date <= $5)
            ORDER BY holiday_date DESC
            LIMIT $6 OFFSET $7
            "#,
        )
        .bind(&holiday_name_pattern)
        .bind(params.holiday_type)
        .bind(params.country_code)
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
              AND ($3::SMALLINT IS NULL OR country_code = $3)
              AND ($4::DATE IS NULL OR holiday_date >= $4)
              AND ($5::DATE IS NULL OR holiday_date <= $5)
            "#,
        )
        .bind(&holiday_name_pattern)
        .bind(params.holiday_type)
        .bind(params.country_code)
        .bind(params.start_date)
        .bind(params.end_date)
        .fetch_one(pool)
        .await?;

        Ok((holidays, total.0))
    }

    /// 获取所有假期（不分页）
    pub async fn get_all_holidays(
        pool: &PgPool,
        params: HolidayQueryParams,
    ) -> AppResult<Vec<Holiday>> {
        let holiday_name_pattern = params.holiday_name.as_ref().map(|h| format!("%{}%", h));

        let holidays = sqlx::query_as::<_, Holiday>(
            r#"
            SELECT id, holiday_name, description, holiday_date, holiday_type,
                   country_code, creator_id, updater_id, create_date_time, update_date_time
            FROM holidays
            WHERE ($1::TEXT IS NULL OR holiday_name ILIKE $1)
              AND ($2::SMALLINT IS NULL OR holiday_type = $2)
              AND ($3::SMALLINT IS NULL OR country_code = $3)
              AND ($4::DATE IS NULL OR holiday_date >= $4)
              AND ($5::DATE IS NULL OR holiday_date <= $5)
            ORDER BY holiday_date DESC
            "#,
        )
        .bind(&holiday_name_pattern)
        .bind(params.holiday_type)
        .bind(params.country_code)
        .bind(params.start_date)
        .bind(params.end_date)
        .fetch_all(pool)
        .await?;

        Ok(holidays)
    }

    /// 根据 ID 获取假期
    pub async fn get_holiday_by_id(
        pool: &PgPool,
        holiday_id: i64,
    ) -> AppResult<Option<Holiday>> {
        let holiday = sqlx::query_as::<_, Holiday>(
            r#"
            SELECT id, holiday_name, description, holiday_date, holiday_type,
                   country_code, creator_id, updater_id, create_date_time, update_date_time
            FROM holidays
            WHERE id = $1
            "#,
        )
        .bind(holiday_id)
        .fetch_optional(pool)
        .await?;

        Ok(holiday)
    }

    /// 创建假期
    pub async fn create_holiday(
        pool: &PgPool,
        holiday_id: i64,
        params: CreateHolidayParams,
        creator_id: i64,
    ) -> AppResult<Holiday> {
        let holiday = sqlx::query_as::<_, Holiday>(
            r#"
            INSERT INTO holidays (id, holiday_name, description, holiday_date, holiday_type,
                                country_code, creator_id, create_date_time)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id, holiday_name, description, holiday_date, holiday_type,
                      country_code, creator_id, updater_id, create_date_time, update_date_time
            "#,
        )
        .bind(holiday_id)
        .bind(&params.holiday_name)
        .bind(&params.description)
        .bind(params.holiday_date)
        .bind(params.holiday_type)
        .bind(params.country_code)
        .bind(creator_id)
        .fetch_one(pool)
        .await?;

        Ok(holiday)
    }

    /// 更新假期
    pub async fn update_holiday(
        pool: &PgPool,
        holiday_id: i64,
        params: UpdateHolidayParams,
        updater_id: i64,
    ) -> AppResult<Option<Holiday>> {
        // 先检查假期是否存在
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
                country_code = COALESCE($6, country_code),
                updater_id = $7,
                update_date_time = NOW()
            WHERE id = $1
            RETURNING id, holiday_name, description, holiday_date, holiday_type,
                      country_code, creator_id, updater_id, create_date_time, update_date_time
            "#,
        )
        .bind(holiday_id)
        .bind(&params.holiday_name)
        .bind(&params.description)
        .bind(params.holiday_date)
        .bind(params.holiday_type)
        .bind(params.country_code)
        .bind(updater_id)
        .fetch_one(pool)
        .await?;

        Ok(Some(holiday))
    }

    /// 删除假期
    pub async fn delete_holiday(pool: &PgPool, holiday_id: i64) -> AppResult<bool> {
        let result = sqlx::query("DELETE FROM holidays WHERE id = $1")
            .bind(holiday_id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    /// 批量删除假期
    pub async fn batch_delete_holidays(
        pool: &PgPool,
        holiday_ids: Vec<i64>,
    ) -> AppResult<u64> {
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

    /// 批量创建假期
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
                                    country_code, creator_id, create_date_time)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                RETURNING id, holiday_name, description, holiday_date, holiday_type,
                          country_code, creator_id, updater_id, create_date_time, update_date_time
                "#,
            )
            .bind(holiday_id)
            .bind(&param.holiday_name)
            .bind(&param.description)
            .bind(param.holiday_date)
            .bind(param.holiday_type)
            .bind(param.country_code)
            .bind(creator_id)
            .fetch_one(pool)
            .await?;

            holidays.push(holiday);
        }

        Ok(holidays)
    }
}


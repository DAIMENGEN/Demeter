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

        // 构建查询条件
        let mut query = String::from(
            "SELECT id, holiday_name, description, holiday_date, holiday_type, is_recurring,
             country_code, creator_id, updater_id, create_date_time, update_date_time
             FROM holidays WHERE 1=1",
        );
        let mut count_query = String::from("SELECT COUNT(*) FROM holidays WHERE 1=1");

        if let Some(holiday_name) = &params.holiday_name {
            query.push_str(&format!(" AND holiday_name ILIKE '%{}%'", holiday_name));
            count_query.push_str(&format!(" AND holiday_name ILIKE '%{}%'", holiday_name));
        }

        if let Some(holiday_type) = params.holiday_type {
            query.push_str(&format!(" AND holiday_type = {}", holiday_type));
            count_query.push_str(&format!(" AND holiday_type = {}", holiday_type));
        }

        if let Some(country_code) = params.country_code {
            query.push_str(&format!(" AND country_code = {}", country_code));
            count_query.push_str(&format!(" AND country_code = {}", country_code));
        }

        if let Some(is_recurring) = params.is_recurring {
            query.push_str(&format!(" AND is_recurring = {}", is_recurring));
            count_query.push_str(&format!(" AND is_recurring = {}", is_recurring));
        }

        if let Some(start_date) = params.start_date {
            query.push_str(&format!(" AND holiday_date >= '{}'", start_date));
            count_query.push_str(&format!(" AND holiday_date >= '{}'", start_date));
        }

        if let Some(end_date) = params.end_date {
            query.push_str(&format!(" AND holiday_date <= '{}'", end_date));
            count_query.push_str(&format!(" AND holiday_date <= '{}'", end_date));
        }

        query.push_str(&format!(
            " ORDER BY holiday_date DESC LIMIT {} OFFSET {}",
            page_size, offset
        ));

        let holidays = sqlx::query_as::<_, Holiday>(&query)
            .fetch_all(pool)
            .await?;

        let total: (i64,) = sqlx::query_as(&count_query).fetch_one(pool).await?;

        Ok((holidays, total.0))
    }

    /// 获取所有假期（不分页）
    pub async fn get_all_holidays(
        pool: &PgPool,
        params: HolidayQueryParams,
    ) -> AppResult<Vec<Holiday>> {
        let mut query = String::from(
            "SELECT id, holiday_name, description, holiday_date, holiday_type, is_recurring,
             country_code, creator_id, updater_id, create_date_time, update_date_time
             FROM holidays WHERE 1=1",
        );

        if let Some(holiday_name) = &params.holiday_name {
            query.push_str(&format!(" AND holiday_name ILIKE '%{}%'", holiday_name));
        }

        if let Some(holiday_type) = params.holiday_type {
            query.push_str(&format!(" AND holiday_type = {}", holiday_type));
        }

        if let Some(country_code) = params.country_code {
            query.push_str(&format!(" AND country_code = {}", country_code));
        }

        if let Some(is_recurring) = params.is_recurring {
            query.push_str(&format!(" AND is_recurring = {}", is_recurring));
        }

        if let Some(start_date) = params.start_date {
            query.push_str(&format!(" AND holiday_date >= '{}'", start_date));
        }

        if let Some(end_date) = params.end_date {
            query.push_str(&format!(" AND holiday_date <= '{}'", end_date));
        }

        query.push_str(" ORDER BY holiday_date DESC");

        let holidays = sqlx::query_as::<_, Holiday>(&query)
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
            SELECT id, holiday_name, description, holiday_date, holiday_type, is_recurring,
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
        let is_recurring = params.is_recurring.unwrap_or(false);

        let holiday = sqlx::query_as::<_, Holiday>(
            r#"
            INSERT INTO holidays (id, holiday_name, description, holiday_date, holiday_type, is_recurring,
                                country_code, creator_id, create_date_time)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING id, holiday_name, description, holiday_date, holiday_type, is_recurring,
                      country_code, creator_id, updater_id, create_date_time, update_date_time
            "#,
        )
        .bind(holiday_id)
        .bind(&params.holiday_name)
        .bind(&params.description)
        .bind(params.holiday_date)
        .bind(params.holiday_type)
        .bind(is_recurring)
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

        let mut updates = Vec::new();
        let mut bind_count = 1;

        if params.holiday_name.is_some() {
            updates.push(format!("holiday_name = ${}", bind_count));
            bind_count += 1;
        }
        if params.description.is_some() {
            updates.push(format!("description = ${}", bind_count));
            bind_count += 1;
        }
        if params.holiday_date.is_some() {
            updates.push(format!("holiday_date = ${}", bind_count));
            bind_count += 1;
        }
        if params.holiday_type.is_some() {
            updates.push(format!("holiday_type = ${}", bind_count));
            bind_count += 1;
        }
        if params.is_recurring.is_some() {
            updates.push(format!("is_recurring = ${}", bind_count));
            bind_count += 1;
        }
        if params.country_code.is_some() {
            updates.push(format!("country_code = ${}", bind_count));
            bind_count += 1;
        }

        updates.push(format!("updater_id = ${}", bind_count));
        bind_count += 1;
        updates.push(format!("update_date_time = ${}", bind_count));
        bind_count += 1;

        let update_clause = updates.join(", ");
        let query_str = format!(
            r#"
            UPDATE holidays
            SET {}
            WHERE id = ${}
            RETURNING id, holiday_name, description, holiday_date, holiday_type, is_recurring,
                      country_code, creator_id, updater_id, create_date_time, update_date_time
            "#,
            update_clause, bind_count
        );

        let mut query = sqlx::query_as::<_, Holiday>(&query_str);

        if let Some(holiday_name) = params.holiday_name {
            query = query.bind(holiday_name);
        }
        if let Some(description) = params.description {
            query = query.bind(description);
        }
        if let Some(holiday_date) = params.holiday_date {
            query = query.bind(holiday_date);
        }
        if let Some(holiday_type) = params.holiday_type {
            query = query.bind(holiday_type);
        }
        if let Some(is_recurring) = params.is_recurring {
            query = query.bind(is_recurring);
        }
        if let Some(country_code) = params.country_code {
            query = query.bind(country_code);
        }

        query = query.bind(updater_id);
        query = query.bind(chrono::Utc::now().naive_utc());
        query = query.bind(holiday_id);

        let holiday = query.fetch_one(pool).await?;

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
    ) -> AppResult<i64> {
        if holiday_ids.is_empty() {
            return Ok(0);
        }

        let placeholders: Vec<String> = (1..=holiday_ids.len()).map(|i| format!("${}", i)).collect();
        let query_str = format!("DELETE FROM holidays WHERE id IN ({})", placeholders.join(", "));

        let mut query = sqlx::query(&query_str);
        for holiday_id in holiday_ids {
            query = query.bind(holiday_id);
        }

        let result = query.execute(pool).await?;

        Ok(result.rows_affected() as i64)
    }
}


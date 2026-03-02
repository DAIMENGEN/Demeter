use crate::common::error::AppResult;
use crate::modules::organization::department::models::{
    CreateDepartmentParams, Department, DepartmentQueryParams, UpdateDepartmentParams,
};
use sqlx::PgPool;
use sqlx::QueryBuilder;

pub struct DepartmentRepository;

impl DepartmentRepository {
    pub async fn get_department_list(
        pool: &PgPool,
        params: DepartmentQueryParams,
    ) -> AppResult<(Vec<Department>, i64)> {
        let page = params.page.unwrap_or(1);
        let page_size = params.page_size.unwrap_or(10);
        let offset = (page - 1) * page_size;
        let department_name_pattern = params.department_name.as_ref().map(|d| format!("%{}%", d));
        let departments = sqlx::query_as::<_, Department>(
            r#"
            SELECT id, department_name, description, creator_id, updater_id, create_date_time, update_date_time
            FROM departments
            WHERE ($1::TEXT IS NULL OR department_name ILIKE $1)
            ORDER BY create_date_time DESC
            LIMIT $2 OFFSET $3
            "#,
        )
        .bind(&department_name_pattern)
        .bind(page_size)
        .bind(offset)
        .fetch_all(pool)
        .await?;

        let total: (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*)
            FROM departments
            WHERE ($1::TEXT IS NULL OR department_name ILIKE $1)
            "#,
        )
        .bind(&department_name_pattern)
        .fetch_one(pool)
        .await?;

        Ok((departments, total.0))
    }

    pub async fn get_all_departments(
        pool: &PgPool,
        params: DepartmentQueryParams,
    ) -> AppResult<Vec<Department>> {
        let department_name_pattern = params.department_name.as_ref().map(|d| format!("%{}%", d));

        let departments = sqlx::query_as::<_, Department>(
            r#"
            SELECT id, department_name, description, creator_id, updater_id, create_date_time, update_date_time
            FROM departments
            WHERE ($1::TEXT IS NULL OR department_name ILIKE $1)
            ORDER BY create_date_time DESC
            "#,
        )
        .bind(&department_name_pattern)
        .fetch_all(pool)
        .await?;

        Ok(departments)
    }

    pub async fn get_department_by_id(
        pool: &PgPool,
        department_id: i64,
    ) -> AppResult<Option<Department>> {
        let department = sqlx::query_as::<_, Department>(
            r#"
            SELECT id, department_name, description, creator_id, updater_id, create_date_time, update_date_time
            FROM departments
            WHERE id = $1
            "#,
        )
        .bind(department_id)
        .fetch_optional(pool)
        .await?;

        Ok(department)
    }

    pub async fn get_department_by_name(
        pool: &PgPool,
        department_name: &str,
    ) -> AppResult<Option<Department>> {
        let department = sqlx::query_as::<_, Department>(
            r#"
            SELECT id, department_name, description, creator_id, updater_id, create_date_time, update_date_time
            FROM departments
            WHERE department_name = $1
            "#,
        )
        .bind(department_name)
        .fetch_optional(pool)
        .await?;

        Ok(department)
    }

    pub async fn create_department(
        pool: &PgPool,
        department_id: i64,
        params: CreateDepartmentParams,
        creator_id: i64,
    ) -> AppResult<Department> {
        let department = sqlx::query_as::<_, Department>(
            r#"
            INSERT INTO departments (id, department_name, description, creator_id, create_date_time)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id, department_name, description, creator_id, updater_id, create_date_time, update_date_time
            "#
        )
        .bind(department_id)
        .bind(&params.department_name)
        .bind(&params.description)
        .bind(creator_id)
        .fetch_one(pool)
        .await?;

        Ok(department)
    }

    pub async fn update_department(
        pool: &PgPool,
        department_id: i64,
        params: UpdateDepartmentParams,
        updater_id: i64,
    ) -> AppResult<Option<Department>> {
        let existing = Self::get_department_by_id(pool, department_id).await?;
        if existing.is_none() {
            return Ok(None);
        }

        // 动态构建 SET 子句
        let mut qb: QueryBuilder<sqlx::Postgres> = QueryBuilder::new("UPDATE departments SET ");
        let mut has_set = false;

        // NOT NULL 字段
        if let Some(ref name) = params.department_name {
            qb.push("department_name = ");
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
        qb.push_bind(department_id);
        qb.push(
            " RETURNING id, department_name, description, creator_id, updater_id, \
             create_date_time, update_date_time",
        );

        let department = qb
            .build_query_as::<Department>()
            .fetch_one(pool)
            .await?;

        Ok(Some(department))
    }

    pub async fn delete_department(pool: &PgPool, department_id: i64) -> AppResult<bool> {
        let result = sqlx::query(
            r#"
            DELETE FROM departments
            WHERE id = $1
            "#,
        )
        .bind(department_id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn batch_delete_departments(
        pool: &PgPool,
        department_ids: Vec<i64>,
    ) -> AppResult<u64> {
        let result = sqlx::query(
            r#"
            DELETE FROM departments
            WHERE id = ANY($1)
            "#,
        )
        .bind(&department_ids)
        .execute(pool)
        .await?;

        Ok(result.rows_affected())
    }
}

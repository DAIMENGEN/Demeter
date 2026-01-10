use crate::common::error::AppResult;
use crate::modules::department::models::{
    CreateDepartmentParams, Department, DepartmentQueryParams, UpdateDepartmentParams,
};
use sqlx::PgPool;

/// 部门数据访问层
pub struct DepartmentRepository;

impl DepartmentRepository {
    /// 获取部门列表（分页）
    pub async fn get_department_list(
        pool: &PgPool,
        params: DepartmentQueryParams,
    ) -> AppResult<(Vec<Department>, i64)> {
        let page = params.page.unwrap_or(1);
        let page_size = params.page_size.unwrap_or(10);
        let offset = (page - 1) * page_size;

        // 构建查询条件
        let mut query = String::from(
            "SELECT id, department_name, description, creator_id, updater_id, create_date_time, update_date_time
             FROM departments WHERE 1=1",
        );
        let mut count_query = String::from("SELECT COUNT(*) FROM departments WHERE 1=1");

        if let Some(department_name) = &params.department_name {
            query.push_str(&format!(
                " AND department_name ILIKE '%{}%'",
                department_name
            ));
            count_query.push_str(&format!(
                " AND department_name ILIKE '%{}%'",
                department_name
            ));
        }

        query.push_str(&format!(
            " ORDER BY create_date_time DESC LIMIT {} OFFSET {}",
            page_size, offset
        ));

        let departments = sqlx::query_as::<_, Department>(&query)
            .fetch_all(pool)
            .await?;

        let total: (i64,) = sqlx::query_as(&count_query).fetch_one(pool).await?;

        Ok((departments, total.0))
    }

    /// 获取所有部门（不分页）
    pub async fn get_all_departments(
        pool: &PgPool,
        params: DepartmentQueryParams,
    ) -> AppResult<Vec<Department>> {
        let mut query = String::from(
            "SELECT id, department_name, description, creator_id, updater_id, create_date_time, update_date_time
             FROM departments WHERE 1=1",
        );

        if let Some(department_name) = &params.department_name {
            query.push_str(&format!(
                " AND department_name ILIKE '%{}%'",
                department_name
            ));
        }

        query.push_str(" ORDER BY create_date_time DESC");

        let departments = sqlx::query_as::<_, Department>(&query)
            .fetch_all(pool)
            .await?;

        Ok(departments)
    }

    /// 根据 ID 获取部门
    pub async fn get_department_by_id(
        pool: &PgPool,
        id: &str,
    ) -> AppResult<Option<Department>> {
        let department = sqlx::query_as::<_, Department>(
            r#"
            SELECT id, department_name, description, creator_id, updater_id, create_date_time, update_date_time
            FROM departments
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(department)
    }

    /// 根据部门名称获取部门
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

    /// 创建部门
    pub async fn create_department(
        pool: &PgPool,
        params: CreateDepartmentParams,
        creator_id: &str,
    ) -> AppResult<Department> {
        let id = uuid::Uuid::new_v4().to_string();

        let department = sqlx::query_as::<_, Department>(
            r#"
            INSERT INTO departments (id, department_name, description, creator_id, create_date_time)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING id, department_name, description, creator_id, updater_id, create_date_time, update_date_time
            "#
        )
        .bind(&id)
        .bind(&params.department_name)
        .bind(&params.description)
        .bind(creator_id)
        .fetch_one(pool)
        .await?;

        Ok(department)
    }

    /// 更新部门
    pub async fn update_department(
        pool: &PgPool,
        id: &str,
        params: UpdateDepartmentParams,
        updater_id: &str,
    ) -> AppResult<Option<Department>> {
        // 首先检查部门是否存在
        let existing = Self::get_department_by_id(pool, id).await?;
        if existing.is_none() {
            return Ok(None);
        }

        let department = sqlx::query_as::<_, Department>(
            r#"
            UPDATE departments
            SET department_name = COALESCE($2, department_name),
                description = COALESCE($3, description),
                updater_id = $4,
                update_date_time = NOW()
            WHERE id = $1
            RETURNING id, department_name, description, creator_id, updater_id, create_date_time, update_date_time
            "#
        )
        .bind(id)
        .bind(&params.department_name)
        .bind(&params.description)
        .bind(updater_id)
        .fetch_one(pool)
        .await?;

        Ok(Some(department))
    }

    /// 删除部门
    pub async fn delete_department(pool: &PgPool, id: &str) -> AppResult<bool> {
        let result = sqlx::query(
            r#"
            DELETE FROM departments
            WHERE id = $1
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// 批量删除部门
    pub async fn batch_delete_departments(pool: &PgPool, ids: Vec<String>) -> AppResult<u64> {
        let result = sqlx::query(
            r#"
            DELETE FROM departments
            WHERE id = ANY($1)
            "#,
        )
        .bind(&ids)
        .execute(pool)
        .await?;

        Ok(result.rows_affected())
    }
}


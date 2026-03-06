use crate::common::error::AppResult;
use crate::modules::business::project::permission::models::{
    AddDepartmentRoleItem, AddMemberItem, AddTeamRoleItem, ProjectDepartmentRole, ProjectMember,
    ProjectTeamRole,
};
use sqlx::PgPool;

pub struct ProjectMemberRepository;
pub struct ProjectTeamRoleRepository;
pub struct ProjectDepartmentRoleRepository;
pub struct ProjectPermissionResolver;

// ──────────────── 权限解析：多源取最高 ────────────────

impl ProjectPermissionResolver {
    /// 查询用户在项目中的个人角色
    pub async fn get_individual_role(
        pool: &PgPool,
        project_id: i64,
        user_id: i64,
    ) -> AppResult<Option<i32>> {
        let row: Option<(i32,)> =
            sqlx::query_as("SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2")
                .bind(project_id)
                .bind(user_id)
                .fetch_optional(pool)
                .await?;
        Ok(row.map(|r| r.0))
    }

    /// 查询用户通过团队获得的最高角色（MIN = 最高权限）
    pub async fn get_best_team_role(
        pool: &PgPool,
        project_id: i64,
        user_id: i64,
    ) -> AppResult<Option<i32>> {
        // NOTE: Aggregate MIN() always returns one row (with NULL when no matches),
        // so fetch_optional gives Some((NULL,)) — inner Option<i32> is required.
        let row: Option<(Option<i32>,)> = sqlx::query_as(
            r#"
            SELECT MIN(ptr.role)
            FROM project_team_roles ptr
            JOIN user_teams ut ON ut.team_id = ptr.team_id
            WHERE ptr.project_id = $1 AND ut.user_id = $2
            "#,
        )
        .bind(project_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;
        Ok(row.and_then(|r| r.0))
    }

    /// 查询用户通过部门获得的角色
    pub async fn get_department_role(
        pool: &PgPool,
        project_id: i64,
        user_id: i64,
    ) -> AppResult<Option<i32>> {
        let row: Option<(i32,)> = sqlx::query_as(
            r#"
            SELECT pdr.role
            FROM project_department_roles pdr
            JOIN user_departments ud ON ud.department_id = pdr.department_id
            WHERE pdr.project_id = $1 AND ud.user_id = $2
            "#,
        )
        .bind(project_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;
        Ok(row.map(|r| r.0))
    }

    /// 获取用户在项目中的最终角色（取所有来源中的最高权限）
    pub async fn resolve_role(
        pool: &PgPool,
        project_id: i64,
        user_id: i64,
    ) -> AppResult<Option<i32>> {
        let mut best: Option<i32> = None;

        if let Some(role) = Self::get_individual_role(pool, project_id, user_id).await? {
            best = Some(role);
        }

        if let Some(role) = Self::get_best_team_role(pool, project_id, user_id).await? {
            best = Some(best.map_or(role, |b| b.min(role)));
        }

        if let Some(role) = Self::get_department_role(pool, project_id, user_id).await? {
            best = Some(best.map_or(role, |b| b.min(role)));
        }

        Ok(best)
    }

    /// 获取所有角色来源（用于 my-permissions 详情）
    pub async fn get_role_sources(
        pool: &PgPool,
        project_id: i64,
        user_id: i64,
    ) -> AppResult<Vec<(String, Option<String>, i32)>> {
        let mut sources = Vec::new();

        // 个人
        if let Some(role) = Self::get_individual_role(pool, project_id, user_id).await? {
            sources.push(("individual".to_string(), None, role));
        }

        // 团队（可能多个）
        let team_rows: Vec<(i32, String)> = sqlx::query_as(
            r#"
            SELECT ptr.role, t.team_name
            FROM project_team_roles ptr
            JOIN user_teams ut ON ut.team_id = ptr.team_id
            JOIN teams t ON t.id = ptr.team_id
            WHERE ptr.project_id = $1 AND ut.user_id = $2
            "#,
        )
        .bind(project_id)
        .bind(user_id)
        .fetch_all(pool)
        .await?;
        for (role, name) in team_rows {
            sources.push(("team".to_string(), Some(name), role));
        }

        // 部门
        let dept_row: Option<(i32, String)> = sqlx::query_as(
            r#"
            SELECT pdr.role, d.department_name
            FROM project_department_roles pdr
            JOIN user_departments ud ON ud.department_id = pdr.department_id
            JOIN departments d ON d.id = pdr.department_id
            WHERE pdr.project_id = $1 AND ud.user_id = $2
            "#,
        )
        .bind(project_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?;
        if let Some((role, name)) = dept_row {
            sources.push(("department".to_string(), Some(name), role));
        }

        Ok(sources)
    }
}

// ──────────────── 项目成员 CRUD ────────────────

impl ProjectMemberRepository {
    pub async fn get_members(pool: &PgPool, project_id: i64) -> AppResult<Vec<ProjectMember>> {
        let members = sqlx::query_as::<_, ProjectMember>(
            r#"
            SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.create_date_time, pm.update_date_time,
                   u.username, u.full_name
            FROM project_members pm
            LEFT JOIN users u ON u.id = pm.user_id
            WHERE pm.project_id = $1
            ORDER BY pm.role ASC, pm.create_date_time ASC
            "#,
        )
        .bind(project_id)
        .fetch_all(pool)
        .await?;
        Ok(members)
    }

    pub async fn add_members(
        pool: &PgPool,
        project_id: i64,
        items: Vec<(i64, &AddMemberItem)>,
    ) -> AppResult<Vec<ProjectMember>> {
        if items.is_empty() {
            return Ok(vec![]);
        }
        let mut members = Vec::new();
        for (id, item) in items {
            let member = sqlx::query_as::<_, ProjectMember>(
                r#"
                INSERT INTO project_members (id, project_id, user_id, role)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role, update_date_time = CURRENT_TIMESTAMP
                RETURNING id, project_id, user_id, role, create_date_time, update_date_time,
                          NULL::VARCHAR AS username, NULL::VARCHAR AS full_name
                "#,
            )
            .bind(id)
            .bind(project_id)
            .bind(item.user_id.0)
            .bind(item.role)
            .fetch_one(pool)
            .await?;
            members.push(member);
        }
        Ok(members)
    }

    pub async fn update_member_role(
        pool: &PgPool,
        project_id: i64,
        user_id: i64,
        role: i32,
    ) -> AppResult<bool> {
        let result = sqlx::query(
            "UPDATE project_members SET role = $1, update_date_time = CURRENT_TIMESTAMP WHERE project_id = $2 AND user_id = $3",
        )
        .bind(role)
        .bind(project_id)
        .bind(user_id)
        .execute(pool)
        .await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn remove_member(pool: &PgPool, project_id: i64, user_id: i64) -> AppResult<bool> {
        let result =
            sqlx::query("DELETE FROM project_members WHERE project_id = $1 AND user_id = $2")
                .bind(project_id)
                .bind(user_id)
                .execute(pool)
                .await?;
        Ok(result.rows_affected() > 0)
    }
}

// ──────────────── 项目团队角色 CRUD ────────────────

impl ProjectTeamRoleRepository {
    pub async fn get_team_roles(
        pool: &PgPool,
        project_id: i64,
    ) -> AppResult<Vec<ProjectTeamRole>> {
        let roles = sqlx::query_as::<_, ProjectTeamRole>(
            r#"
            SELECT ptr.id, ptr.project_id, ptr.team_id, ptr.role, ptr.create_date_time, ptr.update_date_time,
                   t.team_name
            FROM project_team_roles ptr
            LEFT JOIN teams t ON t.id = ptr.team_id
            WHERE ptr.project_id = $1
            ORDER BY ptr.role ASC, ptr.create_date_time ASC
            "#,
        )
        .bind(project_id)
        .fetch_all(pool)
        .await?;
        Ok(roles)
    }

    pub async fn add_team_roles(
        pool: &PgPool,
        project_id: i64,
        items: Vec<(i64, &AddTeamRoleItem)>,
    ) -> AppResult<Vec<ProjectTeamRole>> {
        if items.is_empty() {
            return Ok(vec![]);
        }
        let mut roles = Vec::new();
        for (id, item) in items {
            let role = sqlx::query_as::<_, ProjectTeamRole>(
                r#"
                INSERT INTO project_team_roles (id, project_id, team_id, role)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (project_id, team_id) DO UPDATE SET role = EXCLUDED.role, update_date_time = CURRENT_TIMESTAMP
                RETURNING id, project_id, team_id, role, create_date_time, update_date_time,
                          NULL::VARCHAR AS team_name
                "#,
            )
            .bind(id)
            .bind(project_id)
            .bind(item.team_id.0)
            .bind(item.role)
            .fetch_one(pool)
            .await?;
            roles.push(role);
        }
        Ok(roles)
    }

    pub async fn update_team_role(
        pool: &PgPool,
        project_id: i64,
        team_id: i64,
        role: i32,
    ) -> AppResult<bool> {
        let result = sqlx::query(
            "UPDATE project_team_roles SET role = $1, update_date_time = CURRENT_TIMESTAMP WHERE project_id = $2 AND team_id = $3",
        )
        .bind(role)
        .bind(project_id)
        .bind(team_id)
        .execute(pool)
        .await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn remove_team_role(
        pool: &PgPool,
        project_id: i64,
        team_id: i64,
    ) -> AppResult<bool> {
        let result =
            sqlx::query("DELETE FROM project_team_roles WHERE project_id = $1 AND team_id = $2")
                .bind(project_id)
                .bind(team_id)
                .execute(pool)
                .await?;
        Ok(result.rows_affected() > 0)
    }
}

// ──────────────── 项目部门角色 CRUD ────────────────

impl ProjectDepartmentRoleRepository {
    pub async fn get_department_roles(
        pool: &PgPool,
        project_id: i64,
    ) -> AppResult<Vec<ProjectDepartmentRole>> {
        let roles = sqlx::query_as::<_, ProjectDepartmentRole>(
            r#"
            SELECT pdr.id, pdr.project_id, pdr.department_id, pdr.role, pdr.create_date_time, pdr.update_date_time,
                   d.department_name
            FROM project_department_roles pdr
            LEFT JOIN departments d ON d.id = pdr.department_id
            WHERE pdr.project_id = $1
            ORDER BY pdr.role ASC, pdr.create_date_time ASC
            "#,
        )
        .bind(project_id)
        .fetch_all(pool)
        .await?;
        Ok(roles)
    }

    pub async fn add_department_roles(
        pool: &PgPool,
        project_id: i64,
        items: Vec<(i64, &AddDepartmentRoleItem)>,
    ) -> AppResult<Vec<ProjectDepartmentRole>> {
        if items.is_empty() {
            return Ok(vec![]);
        }
        let mut roles = Vec::new();
        for (id, item) in items {
            let role = sqlx::query_as::<_, ProjectDepartmentRole>(
                r#"
                INSERT INTO project_department_roles (id, project_id, department_id, role)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (project_id, department_id) DO UPDATE SET role = EXCLUDED.role, update_date_time = CURRENT_TIMESTAMP
                RETURNING id, project_id, department_id, role, create_date_time, update_date_time,
                          NULL::VARCHAR AS department_name
                "#,
            )
            .bind(id)
            .bind(project_id)
            .bind(item.department_id.0)
            .bind(item.role)
            .fetch_one(pool)
            .await?;
            roles.push(role);
        }
        Ok(roles)
    }

    pub async fn update_department_role(
        pool: &PgPool,
        project_id: i64,
        department_id: i64,
        role: i32,
    ) -> AppResult<bool> {
        let result = sqlx::query(
            "UPDATE project_department_roles SET role = $1, update_date_time = CURRENT_TIMESTAMP WHERE project_id = $2 AND department_id = $3",
        )
        .bind(role)
        .bind(project_id)
        .bind(department_id)
        .execute(pool)
        .await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn remove_department_role(
        pool: &PgPool,
        project_id: i64,
        department_id: i64,
    ) -> AppResult<bool> {
        let result = sqlx::query(
            "DELETE FROM project_department_roles WHERE project_id = $1 AND department_id = $2",
        )
        .bind(project_id)
        .bind(department_id)
        .execute(pool)
        .await?;
        Ok(result.rows_affected() > 0)
    }
}

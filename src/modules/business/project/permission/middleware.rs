use crate::common::error::AppError;
use crate::common::jwt::Claims;
use crate::modules::business::project::permission::models::{
    ProjectPermission, ProjectRole, ProjectVisibility,
};
use crate::modules::business::project::permission::repository::ProjectPermissionResolver;
use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use sqlx::PgPool;

/// 项目权限中间件：从 URL 提取 project_id，解析用户的项目角色，注入 ProjectPermission
///
/// 使用方式：
/// ```
/// .layer(middleware::from_fn_with_state(pool.clone(), project_permission_middleware))
/// ```
///
/// 必须在 jwt_auth_middleware 之后使用（依赖 Claims）。
/// 支持路径格式: /projects/{project_id}/... 或 /projects/{id}
pub async fn project_permission_middleware(
    State(pool): State<PgPool>,
    mut request: Request,
    next: Next,
) -> Result<Response, AppError> {
    // 1. 提取 Claims
    let claims = request
        .extensions()
        .get::<Claims>()
        .cloned()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".to_string()))?;

    // 2. 从 URL 路径提取 project_id
    let project_id = extract_project_id_from_path(request.uri().path())?;

    // 3. super_admin 穿透
    if claims.role == "super_admin" {
        request.extensions_mut().insert(ProjectPermission {
            project_id,
            user_id: claims.sub,
            role: ProjectRole::Owner,
        });
        return Ok(next.run(request).await);
    }

    // 4. 多源权限解析（个人 + 团队 + 部门取最高）
    let resolved_role = ProjectPermissionResolver::resolve_role(&pool, project_id, claims.sub).await?;

    let role = if let Some(role_val) = resolved_role {
        ProjectRole::from_i32(role_val)
            .ok_or_else(|| AppError::InternalError(format!("Invalid role value: {}", role_val)))?
    } else {
        // 5. 无授权，检查项目可见性
        let visibility = get_project_visibility(&pool, project_id).await?;
        match visibility {
            ProjectVisibility::Internal | ProjectVisibility::Public => ProjectRole::Viewer,
            ProjectVisibility::Private => {
                return Err(AppError::Forbidden(
                    "You don't have access to this project".to_string(),
                ));
            }
        }
    };

    request.extensions_mut().insert(ProjectPermission {
        project_id,
        user_id: claims.sub,
        role,
    });

    Ok(next.run(request).await)
}

/// 从 URL 路径中提取 project_id
/// 支持: /projects/{id}, /projects/{project_id}/tasks/..., 等
fn extract_project_id_from_path(path: &str) -> Result<i64, AppError> {
    let segments: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();

    // 查找 "projects" 段，其后一段即为 project_id
    for (i, seg) in segments.iter().enumerate() {
        if *seg == "projects" {
            if let Some(id_str) = segments.get(i + 1) {
                // 跳过非数字段（如 "all", "my", "batch-delete" 等）
                if let Ok(id) = id_str.parse::<i64>() {
                    return Ok(id);
                }
            }
        }
    }

    Err(AppError::BadRequest(
        "Could not extract project_id from path".to_string(),
    ))
}

/// 查询项目的可见性
async fn get_project_visibility(pool: &PgPool, project_id: i64) -> Result<ProjectVisibility, AppError> {
    let row: Option<(i32,)> =
        sqlx::query_as("SELECT visibility FROM projects WHERE id = $1")
            .bind(project_id)
            .fetch_optional(pool)
            .await
            .map_err(AppError::from)?;

    match row {
        Some((v,)) => Ok(ProjectVisibility::from_i32(v)),
        None => Err(AppError::NotFound(format!(
            "Project not found: {}",
            project_id
        ))),
    }
}

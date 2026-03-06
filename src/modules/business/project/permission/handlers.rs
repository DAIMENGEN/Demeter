use crate::common::app_state::AppState;
use crate::common::error::{AppError, AppResult};
use crate::common::id::Id;
use crate::common::jwt::Claims;
use crate::common::response::ApiResponse;
use crate::modules::business::project::permission::models::{
    AddDepartmentRolesParams, AddMembersParams, AddTeamRolesParams, MyPermissionsResponse,
    Permission, ProjectDepartmentRole, ProjectMember, ProjectPermission, ProjectRole,
    ProjectTeamRole, RoleSource, UpdateDepartmentRoleParams, UpdateMemberRoleParams,
    UpdateTeamRoleParams,
};
use crate::modules::business::project::permission::repository::{
    ProjectDepartmentRoleRepository, ProjectMemberRepository, ProjectPermissionResolver,
    ProjectTeamRoleRepository,
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Extension, Json,
};

// ──────────────── 成员管理 ────────────────

pub async fn get_members(
    State(state): State<AppState>,
    Extension(perm): Extension<ProjectPermission>,
    Path(project_id): Path<Id>,
) -> AppResult<Json<ApiResponse<Vec<ProjectMember>>>> {
    require_permission(&perm, Permission::ProjectManageMembers)?;
    let members = ProjectMemberRepository::get_members(&state.pool, project_id.0).await?;
    Ok(Json(ApiResponse::success(members)))
}

pub async fn add_members(
    State(state): State<AppState>,
    Extension(perm): Extension<ProjectPermission>,
    Path(project_id): Path<Id>,
    Json(params): Json<AddMembersParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<Vec<ProjectMember>>>)> {
    require_permission(&perm, Permission::ProjectManageMembers)?;

    // 不能添加 Owner 角色（Owner 只能通过转让）
    for item in &params.members {
        validate_assignable_role(item.role, &perm)?;
    }

    let mut items = Vec::new();
    for item in &params.members {
        let id = state
            .generate_id()
            .map_err(|e| AppError::InternalError(format!("Failed to generate ID: {}", e)))?;
        items.push((id, item));
    }

    let members =
        ProjectMemberRepository::add_members(&state.pool, project_id.0, items).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success(members))))
}

pub async fn update_member_role(
    State(state): State<AppState>,
    Extension(perm): Extension<ProjectPermission>,
    Path((project_id, user_id)): Path<(Id, Id)>,
    Json(params): Json<UpdateMemberRoleParams>,
) -> AppResult<StatusCode> {
    require_permission(&perm, Permission::ProjectManageMembers)?;
    validate_assignable_role(params.role, &perm)?;

    let updated = ProjectMemberRepository::update_member_role(
        &state.pool,
        project_id.0,
        user_id.0,
        params.role,
    )
    .await?;

    if !updated {
        return Err(AppError::NotFound("Member not found".to_string()));
    }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn remove_member(
    State(state): State<AppState>,
    Extension(perm): Extension<ProjectPermission>,
    Path((project_id, user_id)): Path<(Id, Id)>,
) -> AppResult<StatusCode> {
    require_permission(&perm, Permission::ProjectManageMembers)?;

    // 不能移除自己
    if perm.user_id == user_id.0 {
        return Err(AppError::BadRequest(
            "Cannot remove yourself from the project".to_string(),
        ));
    }

    let removed =
        ProjectMemberRepository::remove_member(&state.pool, project_id.0, user_id.0).await?;
    if !removed {
        return Err(AppError::NotFound("Member not found".to_string()));
    }
    Ok(StatusCode::NO_CONTENT)
}

// ──────────────── 团队角色管理 ────────────────

pub async fn get_team_roles(
    State(state): State<AppState>,
    Extension(perm): Extension<ProjectPermission>,
    Path(project_id): Path<Id>,
) -> AppResult<Json<ApiResponse<Vec<ProjectTeamRole>>>> {
    require_permission(&perm, Permission::ProjectManageMembers)?;
    let roles = ProjectTeamRoleRepository::get_team_roles(&state.pool, project_id.0).await?;
    Ok(Json(ApiResponse::success(roles)))
}

pub async fn add_team_roles(
    State(state): State<AppState>,
    Extension(perm): Extension<ProjectPermission>,
    Path(project_id): Path<Id>,
    Json(params): Json<AddTeamRolesParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<Vec<ProjectTeamRole>>>)> {
    require_permission(&perm, Permission::ProjectManageMembers)?;

    for item in &params.team_roles {
        validate_assignable_role(item.role, &perm)?;
    }

    let mut items = Vec::new();
    for item in &params.team_roles {
        let id = state
            .generate_id()
            .map_err(|e| AppError::InternalError(format!("Failed to generate ID: {}", e)))?;
        items.push((id, item));
    }

    let roles =
        ProjectTeamRoleRepository::add_team_roles(&state.pool, project_id.0, items).await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success(roles))))
}

pub async fn update_team_role(
    State(state): State<AppState>,
    Extension(perm): Extension<ProjectPermission>,
    Path((project_id, team_id)): Path<(Id, Id)>,
    Json(params): Json<UpdateTeamRoleParams>,
) -> AppResult<StatusCode> {
    require_permission(&perm, Permission::ProjectManageMembers)?;
    validate_assignable_role(params.role, &perm)?;

    let updated = ProjectTeamRoleRepository::update_team_role(
        &state.pool,
        project_id.0,
        team_id.0,
        params.role,
    )
    .await?;

    if !updated {
        return Err(AppError::NotFound("Team role not found".to_string()));
    }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn remove_team_role(
    State(state): State<AppState>,
    Extension(perm): Extension<ProjectPermission>,
    Path((project_id, team_id)): Path<(Id, Id)>,
) -> AppResult<StatusCode> {
    require_permission(&perm, Permission::ProjectManageMembers)?;

    let removed =
        ProjectTeamRoleRepository::remove_team_role(&state.pool, project_id.0, team_id.0).await?;
    if !removed {
        return Err(AppError::NotFound("Team role not found".to_string()));
    }
    Ok(StatusCode::NO_CONTENT)
}

// ──────────────── 部门角色管理 ────────────────

pub async fn get_department_roles(
    State(state): State<AppState>,
    Extension(perm): Extension<ProjectPermission>,
    Path(project_id): Path<Id>,
) -> AppResult<Json<ApiResponse<Vec<ProjectDepartmentRole>>>> {
    require_permission(&perm, Permission::ProjectManageMembers)?;
    let roles =
        ProjectDepartmentRoleRepository::get_department_roles(&state.pool, project_id.0).await?;
    Ok(Json(ApiResponse::success(roles)))
}

pub async fn add_department_roles(
    State(state): State<AppState>,
    Extension(perm): Extension<ProjectPermission>,
    Path(project_id): Path<Id>,
    Json(params): Json<AddDepartmentRolesParams>,
) -> AppResult<(StatusCode, Json<ApiResponse<Vec<ProjectDepartmentRole>>>)> {
    require_permission(&perm, Permission::ProjectManageMembers)?;

    for item in &params.department_roles {
        validate_assignable_role(item.role, &perm)?;
    }

    let mut items = Vec::new();
    for item in &params.department_roles {
        let id = state
            .generate_id()
            .map_err(|e| AppError::InternalError(format!("Failed to generate ID: {}", e)))?;
        items.push((id, item));
    }

    let roles =
        ProjectDepartmentRoleRepository::add_department_roles(&state.pool, project_id.0, items)
            .await?;
    Ok((StatusCode::CREATED, Json(ApiResponse::success(roles))))
}

pub async fn update_department_role(
    State(state): State<AppState>,
    Extension(perm): Extension<ProjectPermission>,
    Path((project_id, department_id)): Path<(Id, Id)>,
    Json(params): Json<UpdateDepartmentRoleParams>,
) -> AppResult<StatusCode> {
    require_permission(&perm, Permission::ProjectManageMembers)?;
    validate_assignable_role(params.role, &perm)?;

    let updated = ProjectDepartmentRoleRepository::update_department_role(
        &state.pool,
        project_id.0,
        department_id.0,
        params.role,
    )
    .await?;

    if !updated {
        return Err(AppError::NotFound("Department role not found".to_string()));
    }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn remove_department_role(
    State(state): State<AppState>,
    Extension(perm): Extension<ProjectPermission>,
    Path((project_id, department_id)): Path<(Id, Id)>,
) -> AppResult<StatusCode> {
    require_permission(&perm, Permission::ProjectManageMembers)?;

    let removed = ProjectDepartmentRoleRepository::remove_department_role(
        &state.pool,
        project_id.0,
        department_id.0,
    )
    .await?;
    if !removed {
        return Err(AppError::NotFound(
            "Department role not found".to_string(),
        ));
    }
    Ok(StatusCode::NO_CONTENT)
}

// ──────────────── 我的权限 ────────────────

pub async fn get_my_permissions(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<Id>,
    Extension(perm): Extension<ProjectPermission>,
) -> AppResult<Json<ApiResponse<MyPermissionsResponse>>> {
    let sources =
        ProjectPermissionResolver::get_role_sources(&state.pool, project_id.0, claims.sub).await?;

    let role_sources: Vec<RoleSource> = if claims.role == "super_admin" {
        vec![RoleSource {
            source: "system".to_string(),
            source_name: Some("super_admin".to_string()),
            role: "owner".to_string(),
        }]
    } else {
        sources
            .into_iter()
            .map(|(source, name, role_val)| RoleSource {
                source,
                source_name: name,
                role: ProjectRole::from_i32(role_val)
                    .map(|r| r.to_string())
                    .unwrap_or_else(|| "unknown".to_string()),
            })
            .collect()
    };

    let permission_names: Vec<String> = Permission::for_role(perm.role)
        .iter()
        .map(|p| {
            serde_json::to_value(p)
                .ok()
                .and_then(|v| v.as_str().map(|s| s.to_string()))
                .unwrap_or_default()
        })
        .collect();

    Ok(Json(ApiResponse::success(MyPermissionsResponse {
        role: perm.role.to_string(),
        role_sources,
        permissions: permission_names,
    })))
}

// ──────────────── 工具函数 ────────────────

fn require_permission(perm: &ProjectPermission, permission: Permission) -> AppResult<()> {
    if !perm.has_permission(permission) {
        return Err(AppError::Forbidden(
            "You don't have permission to perform this action".to_string(),
        ));
    }
    Ok(())
}

/// 校验可分配角色：不能分配比自己更高的角色，且 Owner 不能直接分配
fn validate_assignable_role(role: i32, perm: &ProjectPermission) -> AppResult<()> {
    let target_role = ProjectRole::from_i32(role).ok_or_else(|| {
        AppError::BadRequest(format!("Invalid role value: {}. Valid values: 0-4", role))
    })?;

    // Owner 角色只能通过转让
    if target_role == ProjectRole::Owner {
        return Err(AppError::BadRequest(
            "Owner role can only be transferred, not assigned directly".to_string(),
        ));
    }

    // 不能分配比自己更高权限的角色
    if !perm.role.has_at_least(target_role) {
        return Err(AppError::Forbidden(
            "Cannot assign a role higher than your own".to_string(),
        ));
    }

    Ok(())
}

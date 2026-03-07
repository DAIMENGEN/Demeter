use crate::common::id::Id;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

/// 项目角色枚举
/// 数值越小权限越高: Owner(0) > Admin(1) > Maintainer(2) > Member(3) > Viewer(4)
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ProjectRole {
    Owner = 0,
    Admin = 1,
    Maintainer = 2,
    Member = 3,
    Viewer = 4,
}

/// 自定义反序列化：同时接受整数 (0-4) 和字符串 ("owner"/"admin"/...)，保持前后端兼容
impl<'de> Deserialize<'de> for ProjectRole {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        use serde::de;

        struct ProjectRoleVisitor;

        impl<'de> de::Visitor<'de> for ProjectRoleVisitor {
            type Value = ProjectRole;

            fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
                formatter.write_str("an integer 0-4 or a string role name (owner/admin/maintainer/member/viewer)")
            }

            fn visit_i64<E: de::Error>(self, v: i64) -> Result<ProjectRole, E> {
                ProjectRole::from_i32(v as i32)
                    .ok_or_else(|| de::Error::custom(format!("invalid role value: {v}. Valid: 0-4")))
            }

            fn visit_u64<E: de::Error>(self, v: u64) -> Result<ProjectRole, E> {
                ProjectRole::from_i32(v as i32)
                    .ok_or_else(|| de::Error::custom(format!("invalid role value: {v}. Valid: 0-4")))
            }

            fn visit_str<E: de::Error>(self, v: &str) -> Result<ProjectRole, E> {
                match v {
                    "owner" => Ok(ProjectRole::Owner),
                    "admin" => Ok(ProjectRole::Admin),
                    "maintainer" => Ok(ProjectRole::Maintainer),
                    "member" => Ok(ProjectRole::Member),
                    "viewer" => Ok(ProjectRole::Viewer),
                    _ => Err(de::Error::custom(format!(
                        "invalid role: '{v}'. Valid: owner/admin/maintainer/member/viewer"
                    ))),
                }
            }
        }

        deserializer.deserialize_any(ProjectRoleVisitor)
    }
}

impl ProjectRole {
    pub fn from_i32(v: i32) -> Option<Self> {
        match v {
            0 => Some(ProjectRole::Owner),
            1 => Some(ProjectRole::Admin),
            2 => Some(ProjectRole::Maintainer),
            3 => Some(ProjectRole::Member),
            4 => Some(ProjectRole::Viewer),
            _ => None,
        }
    }

    #[allow(unused)]
    pub fn as_i32(self) -> i32 {
        self as i32
    }

    /// 当前角色是否 >= 所需角色（数值越小权限越高）
    pub fn has_at_least(&self, required: ProjectRole) -> bool {
        (*self as i32) <= (required as i32)
    }
}

impl std::fmt::Display for ProjectRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ProjectRole::Owner => write!(f, "owner"),
            ProjectRole::Admin => write!(f, "admin"),
            ProjectRole::Maintainer => write!(f, "maintainer"),
            ProjectRole::Member => write!(f, "member"),
            ProjectRole::Viewer => write!(f, "viewer"),
        }
    }
}

/// 项目可见性
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProjectVisibility {
    /// 仅成员可见
    Private = 0,
    /// 所有登录用户可见（操作需成员权限）
    Internal = 1,
    /// 所有人可见
    Public = 2,
}

impl ProjectVisibility {
    pub fn from_i32(v: i32) -> Self {
        match v {
            1 => ProjectVisibility::Internal,
            2 => ProjectVisibility::Public,
            _ => ProjectVisibility::Private,
        }
    }
}

/// 具体权限
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Permission {
    // 项目
    ProjectView,
    ProjectEdit,
    ProjectDelete,
    ProjectManageMembers,
    ProjectTransferOwnership,
    // 属性配置
    AttributeConfigView,
    AttributeConfigCreate,
    AttributeConfigEdit,
    AttributeConfigArchive,
    // 任务
    TaskView,
    TaskCreate,
    TaskEditAll,
    TaskEditOwn,
    TaskDeleteAll,
    TaskDeleteOwn,
    TaskBatchOperate,
}

impl Permission {
    /// 根据角色返回该角色拥有的所有权限
    pub fn for_role(role: ProjectRole) -> Vec<Permission> {
        match role {
            ProjectRole::Owner => vec![
                Permission::ProjectView,
                Permission::ProjectEdit,
                Permission::ProjectDelete,
                Permission::ProjectManageMembers,
                Permission::ProjectTransferOwnership,
                Permission::AttributeConfigView,
                Permission::AttributeConfigCreate,
                Permission::AttributeConfigEdit,
                Permission::AttributeConfigArchive,
                Permission::TaskView,
                Permission::TaskCreate,
                Permission::TaskEditAll,
                Permission::TaskEditOwn,
                Permission::TaskDeleteAll,
                Permission::TaskDeleteOwn,
                Permission::TaskBatchOperate,
            ],
            ProjectRole::Admin => vec![
                Permission::ProjectView,
                Permission::ProjectEdit,
                Permission::ProjectManageMembers,
                Permission::AttributeConfigView,
                Permission::AttributeConfigCreate,
                Permission::AttributeConfigEdit,
                Permission::AttributeConfigArchive,
                Permission::TaskView,
                Permission::TaskCreate,
                Permission::TaskEditAll,
                Permission::TaskEditOwn,
                Permission::TaskDeleteAll,
                Permission::TaskDeleteOwn,
                Permission::TaskBatchOperate,
            ],
            ProjectRole::Maintainer => vec![
                Permission::ProjectView,
                Permission::AttributeConfigView,
                Permission::AttributeConfigCreate,
                Permission::AttributeConfigEdit,
                Permission::AttributeConfigArchive,
                Permission::TaskView,
                Permission::TaskCreate,
                Permission::TaskEditAll,
                Permission::TaskEditOwn,
                Permission::TaskDeleteAll,
                Permission::TaskDeleteOwn,
                Permission::TaskBatchOperate,
            ],
            ProjectRole::Member => vec![
                Permission::ProjectView,
                Permission::AttributeConfigView,
                Permission::TaskView,
            ],
            ProjectRole::Viewer => vec![
                Permission::ProjectView,
                Permission::TaskView,
            ],
        }
    }
}

/// 已解析的项目权限（注入到 Request Extensions）
#[derive(Debug, Clone)]
pub struct ProjectPermission {
    #[allow(unused)]
    pub project_id: i64,
    pub user_id: i64,
    pub role: ProjectRole,
}

impl ProjectPermission {
    pub fn has_permission(&self, permission: Permission) -> bool {
        Permission::for_role(self.role).contains(&permission)
    }

    /// 检查权限，不满足时返回 Forbidden 错误
    pub fn require(&self, permission: Permission) -> crate::common::error::AppResult<()> {
        if !self.has_permission(permission) {
            return Err(crate::common::error::AppError::Forbidden(
                "You don't have permission to perform this action".to_string(),
            ));
        }
        Ok(())
    }

    /// 检查是否可操作某资源（考虑 own 类型权限）
    pub fn can_operate(&self, edit_all: Permission, edit_own: Permission, creator_id: i64) -> bool {
        if self.has_permission(edit_all) {
            return true;
        }
        if self.has_permission(edit_own) && creator_id == self.user_id {
            return true;
        }
        false
    }
}

// ──────────────── 项目成员相关模型 ────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ProjectMember {
    pub id: Id,
    pub project_id: Id,
    pub user_id: Id,
    pub role: i32,
    pub create_date_time: chrono::NaiveDateTime,
    pub update_date_time: Option<chrono::NaiveDateTime>,
    // JOIN 字段
    pub username: Option<String>,
    pub full_name: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddMemberItem {
    pub user_id: Id,
    pub role: ProjectRole,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddMembersParams {
    pub members: Vec<AddMemberItem>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMemberRoleParams {
    pub role: ProjectRole,
}

// ──────────────── 项目团队角色相关模型 ────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ProjectTeamRole {
    pub id: Id,
    pub project_id: Id,
    pub team_id: Id,
    pub role: i32,
    pub create_date_time: chrono::NaiveDateTime,
    pub update_date_time: Option<chrono::NaiveDateTime>,
    // JOIN 字段
    pub team_name: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddTeamRoleItem {
    pub team_id: Id,
    pub role: ProjectRole,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddTeamRolesParams {
    pub team_roles: Vec<AddTeamRoleItem>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTeamRoleParams {
    pub role: ProjectRole,
}

// ──────────────── 项目部门角色相关模型 ────────────────

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ProjectDepartmentRole {
    pub id: Id,
    pub project_id: Id,
    pub department_id: Id,
    pub role: i32,
    pub create_date_time: chrono::NaiveDateTime,
    pub update_date_time: Option<chrono::NaiveDateTime>,
    // JOIN 字段
    pub department_name: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddDepartmentRoleItem {
    pub department_id: Id,
    pub role: ProjectRole,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddDepartmentRolesParams {
    pub department_roles: Vec<AddDepartmentRoleItem>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDepartmentRoleParams {
    pub role: ProjectRole,
}

// ──────────────── 权限查询响应 ────────────────

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RoleSource {
    pub source: String,
    pub source_name: Option<String>,
    pub role: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MyPermissionsResponse {
    pub role: String,
    pub role_sources: Vec<RoleSource>,
    pub permissions: Vec<String>,
}

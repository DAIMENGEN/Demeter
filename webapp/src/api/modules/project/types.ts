/**
 * 项目模块类型定义
 */

/**
 * 项目状态枚举
 */
export const ProjectStatus = {
  /** 规划中 */
  PLANNING: 1,
  /** 进行中 */
  IN_PROGRESS: 2,
  /** 已暂停 */
  PAUSED: 3,
  /** 已完成 */
  COMPLETED: 4,
  /** 已取消 */
  CANCELLED: 5,
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

/**
 * 项目可见性枚举
 */
export const ProjectVisibility = {
  /** 仅成员可见 */
  PRIVATE: 0,
  /** 所有登录用户可见（操作需成员权限） */
  INTERNAL: 1,
  /** 所有人可见 */
  PUBLIC: 2,
} as const;

export type ProjectVisibility = (typeof ProjectVisibility)[keyof typeof ProjectVisibility];

/**
 * 项目可见性标签映射 (i18n keys)
 */
export const ProjectVisibilityLabelKeys: Record<ProjectVisibility, string> = {
  [ProjectVisibility.PRIVATE]: "project.visibilityPrivate",
  [ProjectVisibility.INTERNAL]: "project.visibilityInternal",
  [ProjectVisibility.PUBLIC]: "project.visibilityPublic",
};

/**
 * 项目角色枚举（数值越小权限越高）
 */
export const ProjectRole = {
  OWNER: 0,
  ADMIN: 1,
  MAINTAINER: 2,
  MEMBER: 3,
  VIEWER: 4,
} as const;

export type ProjectRole = (typeof ProjectRole)[keyof typeof ProjectRole];

/**
 * 项目角色标签映射 (i18n keys)
 */
export const ProjectRoleLabelKeys: Record<ProjectRole, string> = {
  [ProjectRole.OWNER]: "project.roleOwner",
  [ProjectRole.ADMIN]: "project.roleAdmin",
  [ProjectRole.MAINTAINER]: "project.roleMaintainer",
  [ProjectRole.MEMBER]: "project.roleMember",
  [ProjectRole.VIEWER]: "project.roleViewer",
};

/**
 * 项目状态标签映射 (i18n keys)
 */
export const ProjectStatusLabelKeys: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "project.statusPlanning",
  [ProjectStatus.IN_PROGRESS]: "project.statusInProgress",
  [ProjectStatus.PAUSED]: "project.statusPaused",
  [ProjectStatus.COMPLETED]: "project.statusCompleted",
  [ProjectStatus.CANCELLED]: "project.statusCancelled",
};

/**
 * 项目数据类型
 */
export interface Project {
  id: string;
  projectName: string;
  description?: string;
  startDateTime: string;
  endDateTime?: string;
  projectStatus: ProjectStatus;
  version?: number;
  order?: number;
  /** 可见性: 0=private, 1=internal, 2=public */
  visibility: ProjectVisibility;
  creatorId: string;
  updaterId?: string;
  createDateTime: string;
  updateDateTime?: string;
}

/**
 * 创建项目参数
 */
export interface CreateProjectParams {
  projectName: string;
  description?: string;
  startDateTime: string;
  endDateTime?: string;
  projectStatus: ProjectStatus;
  version?: number;
  order?: number;
  /** 可见性，默认 0 (private) */
  visibility?: ProjectVisibility;
}

/**
 * 更新项目参数
 *
 * 三态语义（与后端 Patch 语义对齐）：
 * - 字段未传（undefined / 不出现）：保持原值
 * - 字段传 null：清空（仅允许可空列）
 * - 字段传具体值：更新为该值
 */
export interface UpdateProjectParams {
  projectName?: string;
  /** 可空字段：传 null 可清空 */
  description?: string | null;
  startDateTime?: string;
  /** 可空字段：传 null 可清空 */
  endDateTime?: string | null;
  projectStatus?: ProjectStatus;
  /** 可空字段：传 null 可清空 */
  version?: number | null;
  /** 可空字段：传 null 可清空 */
  order?: number | null;
  visibility?: ProjectVisibility;
}

/**
 * 项目查询参数
 */
export interface ProjectQueryParams {
  page?: number;
  perPage?: number;
  projectName?: string;
  projectStatus?: ProjectStatus;
  startDateTime?: string;
  endDateTime?: string;
}

/**
 * 批量删除项目参数
 */
export interface BatchDeleteProjectsParams {
  ids: string[];
}

/**
 * 重排项目顺序参数
 */
export interface ReorderProjectsParams {
  projectIds: string[];
}

/**
 * 最近访问项目查询参数
 */
export interface RecentlyVisitedQueryParams {
  limit?: number;
  projectName?: string;
}

/**
 * Task attribute config (per-project) - mirrors backend: src/modules/business/project/task/models.rs
 */
export type ProjectTaskAttributeType = "text" | "number" | "boolean" | "date" | "datetime" | "select" | "user";

export const ProjectTaskAttributeTypeLabelKeys: Record<ProjectTaskAttributeType, string> = {
  text: "attributeConfig.typeText",
  number: "attributeConfig.typeNumber",
  boolean: "attributeConfig.typeBoolean",
  date: "attributeConfig.typeDate",
  datetime: "attributeConfig.typeDatetime",
  select: "attributeConfig.typeSelect",
  user: "attributeConfig.typeUser"
};

/**
 * A minimal JSON value type compatible with serde_json::Value.
 */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface ProjectTaskAttributeConfig {
  id: string;
  projectId: string;
  attributeName: string;
  attributeLabel: string;
  attributeType: ProjectTaskAttributeType | string;
  isRequired: boolean;
  defaultValue: string | null;
  options: JsonValue | null;
  valueColorMap: JsonValue | null;
  order: number | null;
  isArchived: boolean;
  creatorId: string;
  updaterId: string | null;
  createDateTime: string;
  updateDateTime: string | null;
}

export interface CreateProjectTaskAttributeConfigParams {
  attributeName: string;
  attributeLabel: string;
  /** backend is String; we restrict to enum for UI */
  attributeType: ProjectTaskAttributeType;
  isRequired: boolean;
  defaultValue?: string | null;
  options?: JsonValue | null;
  valueColorMap?: JsonValue | null;
  order?: number | null;
}

/**
 * 更新任务字段配置参数
 *
 * 三态语义（与后端 Patch 语义对齐）：
 * - 字段未传（undefined / 不出现）：保持原值
 * - 字段传 null：清空（仅允许可空列）
 * - 字段传具体值：更新为该值
 */
export interface UpdateProjectTaskAttributeConfigParams {
  attributeLabel?: string;
  isRequired?: boolean;
  /** 可空字段：传 null 可清空 */
  defaultValue?: string | null;
  /** 可空字段：传 null 可清空 */
  options?: JsonValue | null;
  /** 可空字段：传 null 可清空 */
  valueColorMap?: JsonValue | null;
  /** 可空字段：传 null 可清空 */
  order?: number | null;
}

export interface BatchDeleteProjectTaskAttributeConfigsParams {
  ids: string[];
}

/**
 * Task - mirrors backend: src/modules/business/project/task/models.rs
 */
export const ProjectTaskType = {
  UNKNOWN: 0,
  DEFAULT: 1,
  MILESTONE: 2,
  CHECKPOINT: 3,
} as const;

export type ProjectTaskType = (typeof ProjectTaskType)[keyof typeof ProjectTaskType];

export const TaskTypeLabelKeys: Record<ProjectTaskType, string> = {
  [ProjectTaskType.UNKNOWN]: "task.taskTypeUnknown",
  [ProjectTaskType.DEFAULT]: "task.taskTypeDefault",
  [ProjectTaskType.MILESTONE]: "task.taskTypeMilestone",
  [ProjectTaskType.CHECKPOINT]: "task.taskTypeCheckpoint",
};

export interface ProjectTask {
  id: string;
  taskName: string;
  parentId: string | null;
  projectId: string;
  order: number;
  customAttributes: JsonValue;
  startDateTime: string;
  endDateTime: string;
  taskType: number;
  creatorId: string;
  updaterId: string | null;
  createDateTime: string;
  updateDateTime: string | null;
}

export interface CreateProjectTaskParams {
  taskName: string;
  parentId?: string | null;
  order: number;
  startDateTime: string;
  endDateTime: string;
  taskType: number;
  customAttributes?: JsonValue | null;
}

/**
 * 更新 task 参数
 *
 * 三态语义（与后端 Patch 语义对齐）：
 * - 字段未传（undefined / 不出现）：保持原值
 * - 字段传 null：清空（仅允许可空列）
 * - 字段传具体值：更新为该值
 */
export interface UpdateProjectTaskParams {
  taskName?: string;
  /** 可空字段：传 null 可清空父任务关系 */
  parentId?: string | null;
  order?: number;
  startDateTime?: string;
  endDateTime?: string;
  taskType?: number;
  customAttributes?: JsonValue;
}

export interface ReorderProjectTasksParams {
  /** null 表示重排根任务 */
  parentId?: string | null;
}

export interface BatchCreateProjectTasksParams {
  tasks: CreateProjectTaskParams[];
}

// ──────────────── 项目权限相关类型 ────────────────

/**
 * 项目成员
 */
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: number;
  createDateTime: string;
  updateDateTime: string | null;
  username?: string;
  fullName?: string;
}

/**
 * 项目团队角色
 */
export interface ProjectTeamRole {
  id: string;
  projectId: string;
  teamId: string;
  role: number;
  createDateTime: string;
  updateDateTime: string | null;
  teamName?: string;
}

/**
 * 项目部门角色
 */
export interface ProjectDepartmentRole {
  id: string;
  projectId: string;
  departmentId: string;
  role: number;
  createDateTime: string;
  updateDateTime: string | null;
  departmentName?: string;
}

/**
 * 角色来源信息
 */
export interface RoleSource {
  source: string;
  sourceName?: string;
  role: string;
}

/**
 * 我的项目权限响应
 */
export interface MyPermissionsResponse {
  role: string;
  roleSources: RoleSource[];
  permissions: string[];
}

/**
 * 添加成员参数
 */
export interface AddMembersParams {
  members: { userId: string; role: number }[];
}

/**
 * 更新成员角色参数
 */
export interface UpdateMemberRoleParams {
  role: number;
}

/**
 * 添加团队角色参数
 */
export interface AddTeamRolesParams {
  teamRoles: { teamId: string; role: number }[];
}

/**
 * 更新团队角色参数
 */
export interface UpdateTeamRoleParams {
  role: number;
}

/**
 * 添加部门角色参数
 */
export interface AddDepartmentRolesParams {
  departmentRoles: { departmentId: string; role: number }[];
}

/**
 * 更新部门角色参数
 */
export interface UpdateDepartmentRoleParams {
  role: number;
}

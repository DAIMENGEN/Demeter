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
}

/**
 * 更新项目参数
 */
export interface UpdateProjectParams {
  projectName?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  projectStatus?: ProjectStatus;
  version?: number;
  order?: number;
}

/**
 * 项目查询参数
 */
export interface ProjectQueryParams {
  page?: number;
  pageSize?: number;
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

export interface UpdateProjectTaskAttributeConfigParams {
  attributeLabel?: string;
  isRequired?: boolean;
  defaultValue?: string | null;
  options?: JsonValue | null;
  valueColorMap?: JsonValue | null;
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
 * Mirrors backend UpdateTaskParams (all optional)
 */
export interface UpdateProjectTaskParams {
  taskName?: string;
  parentId?: string | null;
  order?: number | null;
  startDateTime?: string;
  endDateTime?: string;
  taskType?: number;
  customAttributes?: JsonValue | null;
}

export interface ReorderProjectTasksParams {
  /** null 表示重排根任务 */
  parentId?: string | null;
}

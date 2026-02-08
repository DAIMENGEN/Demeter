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
 * 项目状态标签映射
 */
export const ProjectStatusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "规划中",
  [ProjectStatus.IN_PROGRESS]: "进行中",
  [ProjectStatus.PAUSED]: "已暂停",
  [ProjectStatus.COMPLETED]: "已完成",
  [ProjectStatus.CANCELLED]: "已取消",
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
 * Task attribute config (per-project) - mirrors backend: src/modules/business/project/task/models.rs
 */
export type ProjectTaskAttributeType = "text" | "number" | "boolean" | "date" | "datetime" | "select" | "user";

export const ProjectTaskAttributeTypeLabels: Record<ProjectTaskAttributeType, string> = {
  text: "文本",
  number: "数字",
  boolean: "布尔",
  date: "日期",
  datetime: "日期时间",
  select: "选项",
  user: "人员"
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

export const TaskTypeLabels: Record<ProjectTaskType, string> = {
  [ProjectTaskType.UNKNOWN]: "未指定",
  [ProjectTaskType.DEFAULT]: "普通任务",
  [ProjectTaskType.MILESTONE]: "里程碑",
  [ProjectTaskType.CHECKPOINT]: "检查点",
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

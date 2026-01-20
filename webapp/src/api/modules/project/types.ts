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
  CANCELLED: 5
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
  [ProjectStatus.CANCELLED]: "已取消"
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
 * 批量删除参数
 */
export interface BatchDeleteParams {
  ids: string[];
}

/**
 * Task attribute config (per-project) - mirrors backend: src/modules/business/project/task/models.rs
 */
export type AttributeType = "text" | "number" | "boolean" | "date" | "datetime" | "select" | "user";

export const AttributeTypeLabels: Record<AttributeType, string> = {
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

export interface TaskAttributeConfig {
  id: string;
  projectId: string;
  attributeName: string;
  attributeLabel: string;
  attributeType: AttributeType | string;
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

export interface CreateTaskAttributeConfigParams {
  attributeName: string;
  attributeLabel: string;
  /** backend is String; we restrict to enum for UI */
  attributeType: AttributeType;
  isRequired: boolean;
  defaultValue?: string | null;
  options?: JsonValue | null;
  valueColorMap?: JsonValue | null;
  order?: number | null;
}

export interface UpdateTaskAttributeConfigParams {
  attributeLabel?: string;
  isRequired?: boolean;
  defaultValue?: string | null;
  options?: JsonValue | null;
  valueColorMap?: JsonValue | null;
  order?: number | null;
}

export interface BatchDeleteTaskAttributeConfigsParams {
  ids: string[];
}

/**
 * Task - mirrors backend: src/modules/business/project/task/models.rs
 */
export const TaskType = {
  UNKNOWN: 0,
  DEFAULT: 1,
  MILESTONE: 2,
  CHECKPOINT: 3
} as const;

export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export const TaskTypeLabels: Record<TaskType, string> = {
  [TaskType.UNKNOWN]: "未指定",
  [TaskType.DEFAULT]: "普通任务",
  [TaskType.MILESTONE]: "里程碑",
  [TaskType.CHECKPOINT]: "检查点"
};

export interface Task {
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

export interface CreateTaskParams {
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
export interface UpdateTaskParams {
  taskName?: string;
  parentId?: string | null;
  order?: number | null;
  startDateTime?: string;
  endDateTime?: string;
  taskType?: number;
  customAttributes?: JsonValue | null;
}

export interface ReorderTasksParams {
  /** null 表示重排根任务 */
  parentId?: string | null;
}

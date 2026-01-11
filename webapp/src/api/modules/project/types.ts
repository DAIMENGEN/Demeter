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


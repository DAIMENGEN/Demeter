import { get, post, put, del } from "@Webapp/http";
import type { PageResponse } from "@Webapp/http";
import type {
  Project,
  CreateProjectParams,
  UpdateProjectParams,
  ProjectQueryParams,
  BatchDeleteParams,
  ProjectTaskAttributeConfig,
  CreateProjectTaskAttributeConfigParams,
  UpdateProjectTaskAttributeConfigParams,
  BatchDeleteProjectTaskAttributeConfigsParams,
  ProjectTask,
  CreateProjectTaskParams,
  UpdateProjectTaskParams,
  ReorderProjectTasksParams
} from "./types";

/**
 * 项目模块 API
 */
export const projectApi = {
  /**
   * 获取项目列表（分页）
   */
  getProjects: (params?: ProjectQueryParams) => {
    return get<PageResponse<Project>>("/projects", params);
  },

  /**
   * 获取所有项目（不分页）
   */
  getAllProjects: (params?: Omit<ProjectQueryParams, "page" | "pageSize">) => {
    return get<Project[]>("/projects/all", params);
  },

  /**
   * 根据 ID 获取项目
   */
  getProjectById: (id: string) => {
    return get<Project>(`/projects/${id}`);
  },

  /**
   * 根据名称获取项目
   */
  getProjectByName: (projectName: string) => {
    return get<Project>(`/projects/name/${projectName}`);
  },

  /**
   * 创建项目
   */
  createProject: (data: CreateProjectParams) => {
    return post<Project>("/projects", data);
  },

  /**
   * 更新项目
   */
  updateProject: (id: string, data: UpdateProjectParams) => {
    return put<Project>(`/projects/${id}`, data);
  },

  /**
   * 删除项目
   */
  deleteProject: (id: string) => {
    return del<void>(`/projects/${id}`);
  },

  /**
   * 批量删除项目
   */
  batchDeleteProjects: (data: BatchDeleteParams) => {
    return post<void>("/projects/batch-delete", data);
  },

  /**
   * 获取我创建的项目列表（分页）
   */
  getMyProjects: (params?: ProjectQueryParams) => {
    return get<PageResponse<Project>>("/projects/my", params);
  },

  /**
   * 获取我创建的所有项目（不分页）
   */
  getMyAllProjects: (params?: Omit<ProjectQueryParams, "page" | "pageSize">) => {
    return get<Project[]>("/projects/my/all", params);
  },

  /**
   * 获取项目 tasks
   */
  getProjectTasks: (projectId: string) => {
    return get<ProjectTask[]>(`/projects/${projectId}/tasks/all`);
  },

  /**
   * 创建项目 task
   */
  createProjectTask: (projectId: string, data: CreateProjectTaskParams) => {
    return post<ProjectTask>(`/projects/${projectId}/tasks`, data);
  },

  /**
   * 更新项目 task
   */
  updateProjectTask: (projectId: string, taskId: string, data: UpdateProjectTaskParams) => {
    return put<ProjectTask>(`/projects/${projectId}/tasks/${taskId}`, data);
  },

  /**
   * 删除项目 task
   */
  deleteProjectTask: (projectId: string, taskId: string) => {
    return del<void>(`/projects/${projectId}/tasks/${taskId}`);
  },

  /**
   * 重排项目 tasks（同一 parentId 下），将 order 归一为 1..N
   */
  reorderProjectTasks: (projectId: string, data: ReorderProjectTasksParams) => {
    return post<void>(`/projects/${projectId}/tasks/reorder`, data);
  },

  /**
   * 获取项目 task 自定义字段配置
   */
  getProjectTaskAttributeConfigs: (projectId: string) => {
    return get<ProjectTaskAttributeConfig[]>(`/projects/${projectId}/task-attribute-configs`);
  },

  /**
   * 创建项目 task 自定义字段配置
   */
  createProjectTaskAttributeConfig: (projectId: string, data: CreateProjectTaskAttributeConfigParams) => {
    return post<ProjectTaskAttributeConfig>(`/projects/${projectId}/task-attribute-configs`, data);
  },

  /**
   * 更新项目 task 自定义字段配置
   */
  updateProjectTaskAttributeConfig: (
    projectId: string,
    id: string,
    data: UpdateProjectTaskAttributeConfigParams
  ) => {
    return put<ProjectTaskAttributeConfig>(
      `/projects/${projectId}/task-attribute-configs/${id}`,
      data
    );
  },

  /**
   * 删除项目 task 自定义字段配置
   */
  deleteProjectTaskAttributeConfig: (projectId: string, id: string) => {
    return del<void>(`/projects/${projectId}/task-attribute-configs/${id}`);
  },

  /**
   * 批量删除项目 task 自定义字段配置
   */
  batchDeleteProjectTaskAttributeConfigs: (
    projectId: string,
    data: BatchDeleteProjectTaskAttributeConfigsParams
  ) => {
    return post<void>(`/projects/${projectId}/task-attribute-configs/batch-delete`, data);
  }
};

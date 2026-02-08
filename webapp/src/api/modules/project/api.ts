/**
 * 项目模块 API
 */

import { get, post, put, del } from "@Webapp/http";
import type { PageResponse } from "@Webapp/http";
import type {
  Project,
  CreateProjectParams,
  UpdateProjectParams,
  ProjectQueryParams,
  BatchDeleteProjectsParams,
  ProjectTaskAttributeConfig,
  CreateProjectTaskAttributeConfigParams,
  UpdateProjectTaskAttributeConfigParams,
  BatchDeleteProjectTaskAttributeConfigsParams,
  ProjectTask,
  CreateProjectTaskParams,
  UpdateProjectTaskParams,
  ReorderProjectTasksParams,
} from "./types";

/**
 * 项目 API
 */
export const projectApi = {
  /**
   * 获取项目列表（分页）
   */
  getProjectList: (params?: ProjectQueryParams) => {
    return get<PageResponse<Project>>("/projects", params);
  },

  /**
   * 获取所有项目（不分页）
   */
  getAllProjects: (params?: Omit<ProjectQueryParams, "page" | "pageSize">) => {
    return get<Project[]>("/projects/all", params);
  },

  /**
   * 获取我创建的项目列表（分页）
   */
  getMyProjectList: (params?: ProjectQueryParams) => {
    return get<PageResponse<Project>>("/projects/my", params);
  },

  /**
   * 获取我创建的所有项目（不分页）
   */
  getMyAllProjects: () => {
    return get<Project[]>("/projects/my/all");
  },

  /**
   * 根据 ID 获取项目详情
   */
  getProjectById: (id: string) => {
    return get<Project>(`/projects/${id}`);
  },

  /**
   * 根据项目名称获取项目详情
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
  batchDeleteProjects: (params: BatchDeleteProjectsParams) => {
    return post<number>("/projects/batch-delete", params);
  },

  /**
   * 获取项目任务列表
   */
  getProjectTasks: (projectId: string) => {
    return get<ProjectTask[]>(`/projects/${projectId}/tasks/all`);
  },

  /**
   * 创建项目任务
   */
  createProjectTask: (projectId: string, data: CreateProjectTaskParams) => {
    return post<ProjectTask>(`/projects/${projectId}/tasks`, data);
  },

  /**
   * 更新项目任务
   */
  updateProjectTask: (projectId: string, taskId: string, data: UpdateProjectTaskParams) => {
    return put<ProjectTask>(`/projects/${projectId}/tasks/${taskId}`, data);
  },

  /**
   * 删除项目任务
   */
  deleteProjectTask: (projectId: string, taskId: string) => {
    return del<void>(`/projects/${projectId}/tasks/${taskId}`);
  },

  /**
   * 重排项目任务顺序
   */
  reorderProjectTasks: (projectId: string, params: ReorderProjectTasksParams) => {
    return post<void>(`/projects/${projectId}/tasks/reorder`, params);
  },

  /**
   * 获取项目任务自定义字段配置列表
   */
  getProjectTaskAttributeConfigs: (projectId: string) => {
    return get<ProjectTaskAttributeConfig[]>(`/projects/${projectId}/task-attribute-configs`);
  },

  /**
   * 创建项目任务自定义字段配置
   */
  createProjectTaskAttributeConfig: (projectId: string, data: CreateProjectTaskAttributeConfigParams) => {
    return post<ProjectTaskAttributeConfig>(`/projects/${projectId}/task-attribute-configs`, data);
  },

  /**
   * 更新项目任务自定义字段配置
   */
  updateProjectTaskAttributeConfig: (
    projectId: string,
    id: string,
    data: UpdateProjectTaskAttributeConfigParams,
  ) => {
    return put<ProjectTaskAttributeConfig>(
      `/projects/${projectId}/task-attribute-configs/${id}`,
      data,
    );
  },

  /**
   * 删除项目任务自定义字段配置
   */
  deleteProjectTaskAttributeConfig: (projectId: string, id: string) => {
    return del<void>(`/projects/${projectId}/task-attribute-configs/${id}`);
  },

  /**
   * 批量删除项目任务自定义字段配置
   */
  batchDeleteProjectTaskAttributeConfigs: (
    projectId: string,
    params: BatchDeleteProjectTaskAttributeConfigsParams,
  ) => {
    return post<void>(`/projects/${projectId}/task-attribute-configs/batch-delete`, params);
  },
};

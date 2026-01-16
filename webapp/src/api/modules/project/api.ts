import { get, post, put, del } from "@Webapp/http";
import type {
  Project,
  CreateProjectParams,
  UpdateProjectParams,
  ProjectQueryParams,
  BatchDeleteParams,
  TaskAttributeConfig,
  CreateTaskAttributeConfigParams,
  UpdateTaskAttributeConfigParams,
  BatchDeleteTaskAttributeConfigsParams,
  Task,
  CreateTaskParams,
  UpdateTaskParams,
  ReorderTasksParams
} from "./types";

/**
 * 项目模块 API
 */
export const projectApi = {
  /**
   * 获取项目列表（分页）
   */
  getProjects: (params?: ProjectQueryParams) => {
    return get<Project[]>("/projects", { params });
  },

  /**
   * 获取所有项目（不分页）
   */
  getAllProjects: (params?: Omit<ProjectQueryParams, "page" | "pageSize">) => {
    return get<Project[]>("/projects/all", { params });
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
    return del(`/projects/${id}`);
  },

  /**
   * 批量删除项目
   */
  batchDeleteProjects: (data: BatchDeleteParams) => {
    return post("/projects/batch-delete", data);
  },

  /**
   * 获取我创建的项目列表（分页）
   */
  getMyProjects: (params?: ProjectQueryParams) => {
    return get<Project[]>("/projects/my", { params });
  },

  /**
   * 获取我创建的所有项目（不分页）
   */
  getMyAllProjects: (params?: Omit<ProjectQueryParams, "page" | "pageSize">) => {
    return get<Project[]>("/projects/my/all", { params });
  },

  /**
   * 获取项目 tasks
   */
  getTasks: (projectId: string) => {
    return get<Task[]>(`/projects/${projectId}/tasks/all`);
  },

  /**
   * 创建项目 task
   */
  createTask: (projectId: string, data: CreateTaskParams) => {
    return post<Task>(`/projects/${projectId}/tasks`, data);
  },

  /**
   * 更新项目 task
   */
  updateTask: (projectId: string, taskId: string, data: UpdateTaskParams) => {
    return put<Task>(`/projects/${projectId}/tasks/${taskId}`, data);
  },

  /**
   * 删除项目 task
   */
  deleteTask: (projectId: string, taskId: string) => {
    return del(`/projects/${projectId}/tasks/${taskId}`);
  },

  /**
   * 重排项目 tasks（同一 parentId 下），将 order 归一为 1..N
   */
  reorderTasks: (projectId: string, data: ReorderTasksParams) => {
    return post<void>(`/projects/${projectId}/tasks/reorder`, data);
  },

  /**
   * 获取项目 task 自定义字段配置
   */
  getTaskAttributeConfigs: (projectId: string) => {
    return get<TaskAttributeConfig[]>(`/projects/${projectId}/task-attribute-configs`);
  },

  /**
   * 创建项目 task 自定义字段配置
   */
  createTaskAttributeConfig: (projectId: string, data: CreateTaskAttributeConfigParams) => {
    return post<TaskAttributeConfig>(`/projects/${projectId}/task-attribute-configs`, data);
  },

  /**
   * 更新 task 自定义字段配置
   */
  updateTaskAttributeConfig: (
    projectId: string,
    id: string,
    data: UpdateTaskAttributeConfigParams
  ) => {
    return put<TaskAttributeConfig>(
      `/projects/${projectId}/task-attribute-configs/${id}`,
      data
    );
  },

  /**
   * 删除 task 自定义字段配置
   */
  deleteTaskAttributeConfig: (projectId: string, id: string) => {
    return del(`/projects/${projectId}/task-attribute-configs/${id}`);
  },

  /**
   * 批量删除 task 自定义字段配置
   */
  batchDeleteTaskAttributeConfigs: (projectId: string, data: BatchDeleteTaskAttributeConfigsParams) => {
    return post(`/projects/${projectId}/task-attribute-configs/batch-delete`, data);
  }
};

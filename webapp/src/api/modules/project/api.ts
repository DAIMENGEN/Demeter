import { httpClient } from "@Webapp/http";
import type {
  Project,
  CreateProjectParams,
  UpdateProjectParams,
  ProjectQueryParams,
  BatchDeleteParams
} from "./types";

/**
 * 项目模块 API
 */
export const projectApi = {
  /**
   * 获取项目列表（分页）
   */
  getProjects: (params?: ProjectQueryParams) => {
    return httpClient.get<Project[]>("/api/projects", { params });
  },

  /**
   * 获取所有项目（不分页）
   */
  getAllProjects: (params?: Omit<ProjectQueryParams, "page" | "pageSize">) => {
    return httpClient.get<Project[]>("/api/projects/all", { params });
  },

  /**
   * 根据 ID 获取项目
   */
  getProjectById: (id: string) => {
    return httpClient.get<Project>(`/api/projects/${id}`);
  },

  /**
   * 根据名称获取项目
   */
  getProjectByName: (projectName: string) => {
    return httpClient.get<Project>(`/api/projects/name/${projectName}`);
  },

  /**
   * 创建项目
   */
  createProject: (data: CreateProjectParams) => {
    return httpClient.post<Project>("/api/projects", data);
  },

  /**
   * 更新项目
   */
  updateProject: (id: string, data: UpdateProjectParams) => {
    return httpClient.put<Project>(`/api/projects/${id}`, data);
  },

  /**
   * 删除项目
   */
  deleteProject: (id: string) => {
    return httpClient.delete(`/api/projects/${id}`);
  },

  /**
   * 批量删除项目
   */
  batchDeleteProjects: (data: BatchDeleteParams) => {
    return httpClient.post("/api/projects/batch-delete", data);
  },

  /**
   * 获取我创建的项目
   */
  getMyCreatedProjects: (params?: Omit<ProjectQueryParams, "page" | "pageSize">) => {
    return httpClient.get<Project[]>("/api/projects/my-created", { params });
  },

  /**
   * 获取我有权限的所有项目
   */
  getMyAccessibleProjects: (params?: Omit<ProjectQueryParams, "page" | "pageSize">) => {
    return httpClient.get<Project[]>("/api/projects/my-accessible", { params });
  },

  /**
   * 获取最近访问的项目
   */
  getRecentlyAccessedProjects: (limit?: number) => {
    return httpClient.get<Project[]>("/api/projects/recently-accessed", {
      params: { limit }
    });
  }
};


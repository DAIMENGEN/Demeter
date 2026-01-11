import { get, post, put, del } from "@Webapp/http";
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
   * 获取我创建的项目
   */
  getMyCreatedProjects: (params?: Omit<ProjectQueryParams, "page" | "pageSize">) => {
    return get<Project[]>("/projects/my-created", { params });
  },

  /**
   * 获取我有权限的所有项目
   */
  getMyAccessibleProjects: (params?: Omit<ProjectQueryParams, "page" | "pageSize">) => {
    return get<Project[]>("/projects/my-accessible", { params });
  },

  /**
   * 获取最近访问的项目
   */
  getRecentlyAccessedProjects: (limit?: number) => {
    return get<Project[]>("/projects/recently-accessed", {
      params: { limit }
    });
  }
};

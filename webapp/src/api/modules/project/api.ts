/**
 * 项目模块 API
 */

import type {PaginatedResponse, ApiResponse} from "@Webapp/http";
import {del, get, post, put} from "@Webapp/http";
import type {
    AddDepartmentRolesParams,
    AddMembersParams,
    AddTeamRolesParams,
    BatchCreateProjectTasksParams,
    BatchDeleteProjectsParams,
    BatchDeleteProjectTaskAttributeConfigsParams,
    CreateProjectParams,
    CreateProjectTaskAttributeConfigParams,
    CreateProjectTaskParams,
    MyPermissionsResponse,
    Project,
    ProjectDepartmentRole,
    ProjectMember,
    ProjectQueryParams,
    ProjectTask,
    ProjectTaskAttributeConfig,
    ProjectTeamRole,
    RecentlyVisitedQueryParams,
    ReorderProjectsParams,
    ReorderProjectTasksParams,
    UpdateDepartmentRoleParams,
    UpdateMemberRoleParams,
    UpdateProjectParams,
    UpdateProjectTaskAttributeConfigParams,
    UpdateProjectTaskParams,
    UpdateTeamRoleParams,
} from "./types";

/**
 * 项目 API
 */
export const projectApi = {
  /**
   * 获取项目列表（分页）
   */
  getProjectList: (params?: ProjectQueryParams) => {
    return get<PaginatedResponse<Project>>("/projects", params);
  },

  /**
   * 获取所有项目（不分页）
   */
  getAllProjects: (params?: Omit<ProjectQueryParams, "page" | "perPage">) => {
    return get<ApiResponse<Project[]>>("/projects/all", params);
  },

  /**
   * 获取我创建的项目列表（分页）
   */
  getMyProjectList: (params?: ProjectQueryParams) => {
    return get<PaginatedResponse<Project>>("/projects/my", params);
  },

  /**
   * 获取我创建的所有项目（不分页）
   */
  getMyAllProjects: (params?: Omit<ProjectQueryParams, "page" | "perPage">) => {
    return get<ApiResponse<Project[]>>("/projects/my/all", params);
  },

  /**
   * 获取当前用户可访问的所有项目（不分页）
   * 来源：直接成员 + 团队成员 + 部门成员 + Internal/Public 可见性 + 创建者
   */
  getAccessibleProjects: (params?: Omit<ProjectQueryParams, "page" | "perPage">) => {
    return get<ApiResponse<Project[]>>("/projects/accessible", params);
  },

  /**
   * 根据 ID 获取项目详情
   */
  getProjectById: (id: string) => {
    return get<ApiResponse<Project>>(`/projects/${id}`);
  },

  /**
   * 根据项目名称获取项目详情
   */
  getProjectByName: (projectName: string) => {
    return get<ApiResponse<Project>>(`/projects/name/${projectName}`);
  },

  /**
   * 创建项目
   */
  createProject: (data: CreateProjectParams) => {
    return post<ApiResponse<Project>>("/projects", data);
  },

  /**
   * 更新项目
   */
  updateProject: (id: string, data: UpdateProjectParams) => {
    return put<ApiResponse<Project>>(`/projects/${id}`, data);
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
    return post<void>("/projects/batch-delete", params);
  },

  /**
   * 重排项目顺序
   */
  reorderProjects: (params: ReorderProjectsParams) => {
    return post<void>("/projects/reorder", params);
  },

  /**
   * 记录项目访问
   */
  recordProjectVisit: (id: string) => {
    return post<void>(`/projects/${id}/visit`);
  },

  /**
   * 获取最近访问的项目列表
   */
  getRecentlyVisitedProjects: (params?: RecentlyVisitedQueryParams) => {
    return get<ApiResponse<Project[]>>("/projects/recently-visited", params);
  },

  /**
   * 获取项目任务列表
   */
  getProjectTasks: (projectId: string) => {
    return get<ApiResponse<ProjectTask[]>>(`/projects/${projectId}/tasks/all`);
  },

  /**
   * 创建项目任务
   */
  createProjectTask: (projectId: string, data: CreateProjectTaskParams) => {
    return post<ApiResponse<ProjectTask>>(`/projects/${projectId}/tasks`, data);
  },

  /**
   * 批量创建项目任务
   */
  batchCreateProjectTasks: (projectId: string, data: BatchCreateProjectTasksParams) => {
    return post<ApiResponse<ProjectTask[]>>(`/projects/${projectId}/tasks/batch-create`, data);
  },

  /**
   * 更新项目任务
   */
  updateProjectTask: (projectId: string, taskId: string, data: UpdateProjectTaskParams) => {
    return put<ApiResponse<ProjectTask>>(`/projects/${projectId}/tasks/${taskId}`, data);
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
    return get<ApiResponse<ProjectTaskAttributeConfig[]>>(`/projects/${projectId}/task-attribute-configs`);
  },

  /**
   * 创建项目任务自定义字段配置
   */
  createProjectTaskAttributeConfig: (projectId: string, data: CreateProjectTaskAttributeConfigParams) => {
    return post<ApiResponse<ProjectTaskAttributeConfig>>(`/projects/${projectId}/task-attribute-configs`, data);
  },

  /**
   * 更新项目任务自定义字段配置
   */
  updateProjectTaskAttributeConfig: (
    projectId: string,
    id: string,
    data: UpdateProjectTaskAttributeConfigParams,
  ) => {
    return put<ApiResponse<ProjectTaskAttributeConfig>>(
      `/projects/${projectId}/task-attribute-configs/${id}`,
      data,
    );
  },

  /**
   * 删除（归档）项目任务自定义字段配置
   */
  deleteProjectTaskAttributeConfig: (projectId: string, id: string) => {
    return del<void>(`/projects/${projectId}/task-attribute-configs/${id}`);
  },

  /**
   * 恢复已归档的项目任务自定义字段配置
   */
  restoreProjectTaskAttributeConfig: (projectId: string, id: string) => {
    return post<void>(`/projects/${projectId}/task-attribute-configs/${id}/restore`);
  },

  /**
   * 永久删除项目任务自定义字段配置（硬删除）
   */
  hardDeleteProjectTaskAttributeConfig: (projectId: string, id: string) => {
    return del<void>(`/projects/${projectId}/task-attribute-configs/${id}/hard-delete`);
  },

  /**
   * 批量删除（归档）项目任务自定义字段配置
   */
  batchDeleteProjectTaskAttributeConfigs: (
    projectId: string,
    params: BatchDeleteProjectTaskAttributeConfigsParams,
  ) => {
    return post<void>(`/projects/${projectId}/task-attribute-configs/batch-delete`, params);
  },

  // ──────────────── 项目权限管理 ────────────────

  /**
   * 获取项目成员列表
   */
  getMembers: (projectId: string) => {
    return get<ApiResponse<ProjectMember[]>>(`/projects/${projectId}/members`);
  },

  /**
   * 添加项目成员
   */
  addMembers: (projectId: string, data: AddMembersParams) => {
    return post<ApiResponse<ProjectMember[]>>(`/projects/${projectId}/members`, data);
  },

  /**
   * 更新成员角色
   */
  updateMemberRole: (projectId: string, userId: string, data: UpdateMemberRoleParams) => {
    return put<ApiResponse<ProjectMember>>(`/projects/${projectId}/members/${userId}`, data);
  },

  /**
   * 移除项目成员
   */
  removeMember: (projectId: string, userId: string) => {
    return del<void>(`/projects/${projectId}/members/${userId}`);
  },

  /**
   * 获取项目团队角色列表
   */
  getTeamRoles: (projectId: string) => {
    return get<ApiResponse<ProjectTeamRole[]>>(`/projects/${projectId}/team-roles`);
  },

  /**
   * 添加团队角色
   */
  addTeamRoles: (projectId: string, data: AddTeamRolesParams) => {
    return post<ApiResponse<ProjectTeamRole[]>>(`/projects/${projectId}/team-roles`, data);
  },

  /**
   * 更新团队角色
   */
  updateTeamRole: (projectId: string, teamId: string, data: UpdateTeamRoleParams) => {
    return put<ApiResponse<ProjectTeamRole>>(`/projects/${projectId}/team-roles/${teamId}`, data);
  },

  /**
   * 移除团队角色
   */
  removeTeamRole: (projectId: string, teamId: string) => {
    return del<void>(`/projects/${projectId}/team-roles/${teamId}`);
  },

  /**
   * 获取项目部门角色列表
   */
  getDepartmentRoles: (projectId: string) => {
    return get<ApiResponse<ProjectDepartmentRole[]>>(`/projects/${projectId}/department-roles`);
  },

  /**
   * 添加部门角色
   */
  addDepartmentRoles: (projectId: string, data: AddDepartmentRolesParams) => {
    return post<ApiResponse<ProjectDepartmentRole[]>>(`/projects/${projectId}/department-roles`, data);
  },

  /**
   * 更新部门角色
   */
  updateDepartmentRole: (projectId: string, departmentId: string, data: UpdateDepartmentRoleParams) => {
    return put<ApiResponse<ProjectDepartmentRole>>(`/projects/${projectId}/department-roles/${departmentId}`, data);
  },

  /**
   * 移除部门角色
   */
  removeDepartmentRole: (projectId: string, departmentId: string) => {
    return del<void>(`/projects/${projectId}/department-roles/${departmentId}`);
  },

  /**
   * 获取当前用户在项目中的权限
   */
  getMyPermissions: (projectId: string) => {
    return get<ApiResponse<MyPermissionsResponse>>(`/projects/${projectId}/my-permissions`);
  },
};

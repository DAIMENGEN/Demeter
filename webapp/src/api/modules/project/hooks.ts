/**
 * 项目模块 Hooks
 */

import { useCallback, useState } from "react";
import { projectApi } from "./api";
import type {
  Project,
  ProjectQueryParams,
  CreateProjectParams,
  UpdateProjectParams,
  BatchDeleteProjectsParams,
  ProjectTask,
  CreateProjectTaskParams,
  UpdateProjectTaskParams,
  ReorderProjectTasksParams,
  ProjectTaskAttributeConfig,
  CreateProjectTaskAttributeConfigParams,
  UpdateProjectTaskAttributeConfigParams,
  BatchDeleteProjectTaskAttributeConfigsParams,
} from "./types";
import { assertApiOk } from "@Webapp/api/common/response.ts";
import { DEFAULT_PAGINATION, type Pagination } from "@Webapp/api/common/pagination.ts";

/**
 * 项目列表 Hook
 */
export const useProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);

  const fetchProjects = useCallback(async (params?: ProjectQueryParams) => {
    try {
      setLoading(true);
      const response = await projectApi.getProjectList({
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...params,
      });
      const pageRes = assertApiOk(response);
      setProjects(pageRes.list);
      setPagination((prev) => ({
        ...prev,
        total: pageRes.total,
        page: params?.page ?? prev.page,
        pageSize: params?.pageSize ?? prev.pageSize,
      }));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);

  return {
    projects,
    loading,
    pagination,
    fetchProjects,
    setPagination,
  };
};

/**
 * 项目详情 Hook
 */
export const useProjectDetail = () => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProject = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await projectApi.getProjectById(id);
      setProject(assertApiOk(response));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    project,
    loading,
    fetchProject,
  };
};

/**
 * 项目操作 Hook
 */
export const useProjectActions = () => {
  const [loading, setLoading] = useState(false);

  const createProject = useCallback(async (data: CreateProjectParams) => {
    try {
      setLoading(true);
      const response = await projectApi.createProject(data);
      return assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProject = useCallback(async (id: string, data: UpdateProjectParams) => {
    try {
      setLoading(true);
      const response = await projectApi.updateProject(id, data);
      return assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await projectApi.deleteProject(id);
      assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  const batchDeleteProjects = useCallback(async (params: BatchDeleteProjectsParams) => {
    try {
      setLoading(true);
      const response = await projectApi.batchDeleteProjects(params);
      return assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    createProject,
    updateProject,
    deleteProject,
    batchDeleteProjects,
  };
};

/**
 * 获取所有项目（不分页） Hook
 */
export const useAllProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllProjects = useCallback(async (params?: Omit<ProjectQueryParams, "page" | "pageSize">) => {
    try {
      setLoading(true);
      const response = await projectApi.getAllProjects(params);
      setProjects(assertApiOk(response));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    projects,
    loading,
    fetchAllProjects,
  };
};

/**
 * 我创建的项目列表 Hook（分页）
 */
export const useMyProjectList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);

  const fetchProjects = useCallback(async (params?: ProjectQueryParams) => {
    try {
      setLoading(true);
      const response = await projectApi.getMyProjectList({
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...params,
      });
      const pageRes = assertApiOk(response);
      setProjects(pageRes.list);
      setPagination((prev) => ({
        ...prev,
        total: pageRes.total,
        page: params?.page ?? prev.page,
        pageSize: params?.pageSize ?? prev.pageSize,
      }));
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);

  return {
    projects,
    loading,
    pagination,
    fetchProjects,
    setPagination,
  };
};

/**
 * 获取我创建的所有项目（不分页） Hook
 */
export const useMyAllProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllProjects = useCallback(async (params?: Omit<ProjectQueryParams, "page" | "pageSize">) => {
    try {
      setLoading(true);
      const response = await projectApi.getMyAllProjects(params);
      setProjects(assertApiOk(response));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    projects,
    loading,
    fetchAllProjects,
  };
};

/**
 * 项目任务列表 Hook
 */
export const useProjectTaskList = () => {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      const response = await projectApi.getProjectTasks(projectId);
      setTasks(assertApiOk(response));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tasks,
    loading,
    fetchTasks,
  };
};

/**
 * 项目任务操作 Hook
 */
export const useProjectTaskActions = () => {
  const [loading, setLoading] = useState(false);

  const createTask = useCallback(async (projectId: string, data: CreateProjectTaskParams) => {
    try {
      setLoading(true);
      const response = await projectApi.createProjectTask(projectId, data);
      return assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (projectId: string, taskId: string, data: UpdateProjectTaskParams) => {
    try {
      setLoading(true);
      const response = await projectApi.updateProjectTask(projectId, taskId, data);
      return assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = useCallback(async (projectId: string, taskId: string) => {
    try {
      setLoading(true);
      const response = await projectApi.deleteProjectTask(projectId, taskId);
      assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderTasks = useCallback(async (projectId: string, params: ReorderProjectTasksParams) => {
    try {
      setLoading(true);
      const response = await projectApi.reorderProjectTasks(projectId, params);
      assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
  };
};

/**
 * 项目任务自定义字段配置列表 Hook
 */
export const useProjectTaskAttributeConfigList = () => {
  const [configs, setConfigs] = useState<ProjectTaskAttributeConfig[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConfigs = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      const response = await projectApi.getProjectTaskAttributeConfigs(projectId);
      setConfigs(assertApiOk(response));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    configs,
    loading,
    fetchConfigs,
  };
};

/**
 * 项目任务自定义字段配置操作 Hook
 */
export const useProjectTaskAttributeConfigActions = () => {
  const [loading, setLoading] = useState(false);

  const createConfig = useCallback(async (
    projectId: string,
    data: CreateProjectTaskAttributeConfigParams,
  ) => {
    try {
      setLoading(true);
      const response = await projectApi.createProjectTaskAttributeConfig(projectId, data);
      return assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (
    projectId: string,
    id: string,
    data: UpdateProjectTaskAttributeConfigParams,
  ) => {
    try {
      setLoading(true);
      const response = await projectApi.updateProjectTaskAttributeConfig(projectId, id, data);
      return assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteConfig = useCallback(async (projectId: string, id: string) => {
    try {
      setLoading(true);
      const response = await projectApi.deleteProjectTaskAttributeConfig(projectId, id);
      assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  const batchDeleteConfigs = useCallback(async (
    projectId: string,
    params: BatchDeleteProjectTaskAttributeConfigsParams,
  ) => {
    try {
      setLoading(true);
      const response = await projectApi.batchDeleteProjectTaskAttributeConfigs(projectId, params);
      assertApiOk(response);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    createConfig,
    updateConfig,
    deleteConfig,
    batchDeleteConfigs,
  };
};

import { useState, useEffect, useCallback } from "react";
import { projectApi } from "./api";
import type {
  Project,
  CreateProjectParams,
  UpdateProjectParams,
  ProjectQueryParams
} from "./types";

/**
 * 项目列表 Hook
 */
export const useProjects = (params?: ProjectQueryParams) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await projectApi.getProjects(params);
      setProjects(response.data);
    } catch (error) {
      // 由组件层处理 message
      throw error;
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, refetch: fetchProjects };
};

/**
 * 我创建的项目列表 Hook（分页）
 */
export const useMyProjects = (params?: ProjectQueryParams) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await projectApi.getMyProjects(params);
      setProjects(response.data);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, refetch: fetchProjects };
};

/**
 * 我创建的项目 Hook
 */
export const useMyCreatedProjects = (params?: Omit<ProjectQueryParams, "page" | "pageSize">) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await projectApi.getMyAllProjects(params);
      setProjects(response.data);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, refetch: fetchProjects };
};

/**
 * 我有权限的所有项目 Hook
 * TODO: 后续需要后端支持项目成员功能后扩展
 */
export const useMyAccessibleProjects = (params?: Omit<ProjectQueryParams, "page" | "pageSize">) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      // 暂时返回我创建的项目，后续需要包含我作为成员的项目
      const response = await projectApi.getMyAllProjects(params);
      setProjects(response.data);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, refetch: fetchProjects };
};

/**
 * 最近访问的项目 Hook
 * TODO: 可以基于本地存储或后端实现
 */
export const useRecentlyAccessedProjects = (limit = 10) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      // 暂时从我创建的项目中获取前 N 个
      const response = await projectApi.getMyAllProjects();
      setProjects(response.data.slice(0, limit));
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, refetch: fetchProjects };
};

/**
 * 创建项目 Hook
 */
export const useCreateProject = () => {
  const [loading, setLoading] = useState(false);

  const createProject = async (data: CreateProjectParams) => {
    setLoading(true);
    try {
      const response = await projectApi.createProject(data);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { createProject, loading };
};

/**
 * 更新项目 Hook
 */
export const useUpdateProject = () => {
  const [loading, setLoading] = useState(false);

  const updateProject = async (id: string, data: UpdateProjectParams) => {
    setLoading(true);
    try {
      const response = await projectApi.updateProject(id, data);
      return response.data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { updateProject, loading };
};

/**
 * 删除项目 Hook
 */
export const useDeleteProject = () => {
  const [loading, setLoading] = useState(false);

  const deleteProject = async (id: string) => {
    setLoading(true);
    try {
      await projectApi.deleteProject(id);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { deleteProject, loading };
};

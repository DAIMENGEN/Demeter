import { useState, useEffect, useCallback } from "react";
import { message } from "antd";
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
      message.error("获取项目列表失败");
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
export const useMyCreatedProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await projectApi.getAllProjects();
      // 临时实现：获取所有项目，后端需要实现过滤逻辑
      setProjects(response.data);
    } catch (error) {
      message.error("获取我创建的项目失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, refetch: fetchProjects };
};

/**
 * 我有权限的所有项目 Hook
 */
export const useMyAccessibleProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await projectApi.getAllProjects();
      // 临时实现：获取所有项目，后端需要实现权限过滤逻辑
      setProjects(response.data);
    } catch (error) {
      message.error("获取我有权限的项目失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, refetch: fetchProjects };
};

/**
 * 最近访问的项目 Hook
 */
export const useRecentlyAccessedProjects = (limit = 10) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const response = await projectApi.getAllProjects();
      // 临时实现：获取最新的项目，后端需要实现最近访问逻辑
      setProjects(response.data.slice(0, limit));
    } catch (error) {
      message.error("获取最近访问的项目失败");
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
      message.success("创建项目成功");
      return response.data;
    } catch (error) {
      message.error("创建项目失败");
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
      message.success("更新项目成功");
      return response.data;
    } catch (error) {
      message.error("更新项目失败");
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
      message.success("删除项目成功");
    } catch (error) {
      message.error("删除项目失败");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { deleteProject, loading };
};


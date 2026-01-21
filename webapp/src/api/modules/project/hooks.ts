import {useCallback, useEffect, useState} from "react";
import {projectApi} from "./api";
import type {
    CreateProjectParams,
    CreateProjectTaskAttributeConfigParams,
    CreateProjectTaskParams,
    Project,
    ProjectQueryParams,
    ReorderProjectTasksParams,
    ProjectTask,
    ProjectTaskAttributeConfig,
    UpdateProjectParams,
    UpdateProjectTaskAttributeConfigParams,
    UpdateProjectTaskParams
} from "./types";
import {assertApiOk} from "@Webapp/api/common/response.ts";

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
            const page = assertApiOk(response);
            setProjects(page.list);
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        void fetchProjects();
    }, [fetchProjects]);

    return {projects, loading, refetch: fetchProjects};
};

/**
 * 根据 ID 获取项目详情 Hook
 */
export const useProjectById = (id: string) => {
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchProject = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await projectApi.getProjectById(id);
            const project = assertApiOk(response);
            setProject(project);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        void fetchProject();
    }, [fetchProject]);

    return {project, loading, refetch: fetchProject};
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
            const page = assertApiOk(response);
            setProjects(page.list);
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        void fetchProjects();
    }, [fetchProjects]);

    return {projects, loading, refetch: fetchProjects};
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
            const projects = assertApiOk(response);
            setProjects(projects);
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        void fetchProjects();
    }, [fetchProjects]);

    return {projects, loading, refetch: fetchProjects};
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
            const projects = assertApiOk(response);
            setProjects(projects);
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        void fetchProjects();
    }, [fetchProjects]);

    return {projects, loading, refetch: fetchProjects};
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
            const projects = assertApiOk(response);
            setProjects(projects.slice(0, limit));
        } finally {
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        void fetchProjects();
    }, [fetchProjects]);

    return {projects, loading, refetch: fetchProjects};
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
            return assertApiOk(response);
        } finally {
            setLoading(false);
        }
    };

    return {createProject, loading};
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
            return assertApiOk(response);
        } finally {
            setLoading(false);
        }
    };

    return {updateProject, loading};
};

/**
 * 删除项目 Hook
 */
export const useDeleteProject = () => {
    const [loading, setLoading] = useState(false);

    const deleteProject = async (id: string) => {
        setLoading(true);
        try {
            const response = await projectApi.deleteProject(id);
            assertApiOk(response);
        } finally {
            setLoading(false);
        }
    };

    return {deleteProject, loading};
};

/**
 * 项目 task 自定义字段配置列表 Hook
 */
export const useProjectTaskAttributeConfigs = (projectId: string, enabled = true) => {
    const [taskAttributeConfigs, setTaskAttributeConfigs] = useState<ProjectTaskAttributeConfig[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        if (!projectId || !enabled) return;
        setLoading(true);
        try {
            const res = await projectApi.getProjectTaskAttributeConfigs(projectId);
            setTaskAttributeConfigs(assertApiOk(res));
        } finally {
            setLoading(false);
        }
    }, [projectId, enabled]);

    useEffect(() => {
        void fetch();
    }, [fetch]);

    return {data: taskAttributeConfigs, loading, refetch: fetch};
};

export const useCreateProjectTaskAttributeConfig = () => {
    const [loading, setLoading] = useState(false);

    const create = async (projectId: string, data: CreateProjectTaskAttributeConfigParams) => {
        setLoading(true);
        try {
            const res = await projectApi.createProjectTaskAttributeConfig(projectId, data);
            return assertApiOk(res);
        } finally {
            setLoading(false);
        }
    };

    return {create, loading};
};

export const useUpdateProjectTaskAttributeConfig = () => {
    const [loading, setLoading] = useState(false);

    const update = async (projectId: string, id: string, data: UpdateProjectTaskAttributeConfigParams) => {
        setLoading(true);
        try {
            const res = await projectApi.updateProjectTaskAttributeConfig(projectId, id, data);
            return assertApiOk(res);
        } finally {
            setLoading(false);
        }
    };

    return {update, loading};
};

export const useDeleteProjectTaskAttributeConfig = () => {
    const [loading, setLoading] = useState(false);

    const remove = async (projectId: string, id: string) => {
        setLoading(true);
        try {
            const res = await projectApi.deleteProjectTaskAttributeConfig(projectId, id);
            assertApiOk(res);
        } finally {
            setLoading(false);
        }
    };

    return {remove, loading};
};

/**
 * 项目 tasks 列表 Hook
 */
export const useProjectTasks = (projectId: string, enabled = true) => {
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [loading, setLoading] = useState(false);

    const fetch = useCallback(async () => {
        if (!projectId || !enabled) return;
        setLoading(true);
        try {
            const res = await projectApi.getProjectTasks(projectId);
            setTasks(assertApiOk(res));
        } finally {
            setLoading(false);
        }
    }, [projectId, enabled]);

    useEffect(() => {
        void fetch();
    }, [fetch]);

    return {data: tasks, loading, refetch: fetch};
};

export const useCreateProjectTask = () => {
    const [loading, setLoading] = useState(false);

    const create = async (projectId: string, data: CreateProjectTaskParams) => {
        setLoading(true);
        try {
            const res = await projectApi.createProjectTask(projectId, data);
            return assertApiOk(res);
        } finally {
            setLoading(false);
        }
    };

    return {create, loading};
};

export const useUpdateProjectTask = () => {
    const [loading, setLoading] = useState(false);

    const update = async (projectId: string, taskId: string, data: UpdateProjectTaskParams) => {
        setLoading(true);
        try {
            const res = await projectApi.updateProjectTask(projectId, taskId, data);
            return assertApiOk(res);
        } finally {
            setLoading(false);
        }
    };

    return {update, loading};
};

export const useDeleteProjectTask = () => {
    const [loading, setLoading] = useState(false);

    const remove = async (projectId: string, taskId: string) => {
        setLoading(true);
        try {
            const res = await projectApi.deleteProjectTask(projectId, taskId);
            assertApiOk(res);
        } finally {
            setLoading(false);
        }
    };

    return {remove, loading};
};

export const useReorderProjectTasks = () => {
    const [loading, setLoading] = useState(false);

    const reorder = async (projectId: string, data: ReorderProjectTasksParams) => {
        setLoading(true);
        try {
            const res = await projectApi.reorderProjectTasks(projectId, data);
            assertApiOk(res);
        } finally {
            setLoading(false);
        }
    };

    return {reorder, loading};
};

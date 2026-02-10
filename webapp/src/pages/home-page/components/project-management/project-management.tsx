import React, {useCallback, useEffect, useMemo, useState} from "react";
import {App, Layout, Menu} from "antd";
import {useNavigate} from "react-router-dom";
import {ClockCircleOutlined, ExclamationCircleOutlined, FolderOutlined, TeamOutlined} from "@ant-design/icons";
import {type Project, useMyProjectList, useProjectActions} from "@Webapp/api/modules/project";
import "./project-management.scss";
import {ProjectList} from "./components/project-list";
import {CreateProjectDrawer, EditProjectDrawer} from "./components/project-drawer";
import {log} from "@Webapp/logging.ts";
import {useTranslation} from "react-i18next";

const {Sider, Content} = Layout;

export type ProjectViewType = "myCreated" | "myAccessible" | "recentlyAccessed";

export const ProjectManagement: React.FC = () => {
    const {modal} = App.useApp();
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
    const [editDrawerOpen, setEditDrawerOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [selectedView, setSelectedView] = useState<ProjectViewType>("myCreated");

    // 获取不同视图的项目数据
    const {deleteProject} = useProjectActions();
    const myCreatedProjects = useMyProjectList();
    const myAccessibleProjects = useMyProjectList();
    const recentlyAccessedProjects = useMyProjectList();

    // 使用 useMemo 缓存当前视图配置，避免每次渲染都创建新对象
    const viewConfig = useMemo(() => {
        switch (selectedView) {
            case "myCreated":
                return {
                    projects: myCreatedProjects.projects,
                    loading: myCreatedProjects.loading,
                    refetch: myCreatedProjects.fetchProjects,
                    title: t("project.myCreatedTitle"),
                    emptyDescription: t("project.myCreatedEmpty")
                };
            case "myAccessible":
                return {
                    projects: myAccessibleProjects.projects,
                    loading: myAccessibleProjects.loading,
                    refetch: myAccessibleProjects.fetchProjects,
                    title: t("project.myAccessibleTitle"),
                    emptyDescription: t("project.myAccessibleEmpty")
                };
            case "recentlyAccessed":
                return {
                    projects: recentlyAccessedProjects.projects,
                    loading: recentlyAccessedProjects.loading,
                    refetch: recentlyAccessedProjects.fetchProjects,
                    title: t("project.recentlyAccessedTitle"),
                    emptyDescription: t("project.recentlyAccessedEmpty")
                };
            default:
                return {
                    projects: [] as Project[],
                    loading: false,
                    refetch: () => Promise.resolve(),
                    title: t("project.listTitle"),
                    emptyDescription: t("project.listEmpty")
                };
        }
    }, [
        selectedView,
        myCreatedProjects.projects,
        myCreatedProjects.loading,
        myCreatedProjects.fetchProjects,
        myAccessibleProjects.projects,
        myAccessibleProjects.loading,
        myAccessibleProjects.fetchProjects,
        recentlyAccessedProjects.projects,
        recentlyAccessedProjects.loading,
        recentlyAccessedProjects.fetchProjects,
        t,
    ]);

    // 处理项目点击
    const handleProjectClick = useCallback((project: Project) => {
        navigate(`/home/project/${project.id}`);
    }, [navigate]);

    // 处理编辑项目
    const handleEditProject = useCallback((project: Project) => {
        setEditingProject(project);
        setEditDrawerOpen(true);
    }, []);

    // 处理删除项目
    const handleDeleteProject = useCallback(async (project: Project) => {
        const confirmed = await modal.confirm({
            title: t("common.delete"),
            icon: <ExclamationCircleOutlined/>,
            content: t("project.deleteConfirm", {name: project.projectName}),
            okText: t("common.confirm"),
            okType: "danger",
            cancelText: t("common.cancel"),
        });
        if (confirmed) {
            await deleteProject(project.id);
            await viewConfig.refetch();
        }
    }, [modal, t, deleteProject, viewConfig.refetch]);

    // 处理新建项目
    const handleCreateProject = useCallback(() => {
        setCreateDrawerOpen(true);
    }, []);

    // 处理创建项目成功
    const handleCreateSuccess = useCallback(() => {
        viewConfig.refetch().catch(log.error);
    }, [viewConfig.refetch]);

    // 处理编辑项目成功
    const handleEditSuccess = useCallback(() => {
        viewConfig.refetch().catch(log.error);
    }, [viewConfig.refetch]);

    // 处理刷新
    const handleRefresh = useCallback(() => {
        viewConfig.refetch().catch(log.error);
    }, [viewConfig.refetch]);

    // 初始化时加载当前视图的数据
    useEffect(() => {
        viewConfig.refetch().catch(log.error);
    }, [viewConfig.refetch]);

    return (
        <Layout className="project-management">
            <Sider width={200}
                   className="project-sider"
                   collapsible
                   collapsed={collapsed}
                   onCollapse={setCollapsed}>
                <div className="project-sidebar">
                    <Menu mode="inline"
                          selectedKeys={[selectedView]}
                          items={[
                              {
                                  key: "myCreated",
                                  icon: <FolderOutlined/>,
                                  label: t("project.myCreated")
                              },
                              {
                                  key: "myAccessible",
                                  icon: <TeamOutlined/>,
                                  label: t("project.myAccessible")
                              },
                              {
                                  key: "recentlyAccessed",
                                  icon: <ClockCircleOutlined/>,
                                  label: t("project.recentlyAccessed")
                              }
                          ]}
                          onClick={({key}) => setSelectedView(key as ProjectViewType)}
                          inlineCollapsed={collapsed}/>
                </div>
            </Sider>
            <Content className="project-content">
                <ProjectList projects={viewConfig.projects}
                             loading={viewConfig.loading}
                             title={viewConfig.title}
                             emptyDescription={viewConfig.emptyDescription}
                             onClick={handleProjectClick}
                             onEdit={handleEditProject}
                             onDelete={handleDeleteProject}
                             onRefresh={handleRefresh}
                             onCreateNew={selectedView === "myCreated" ? handleCreateProject : undefined}/>
            </Content>
            <CreateProjectDrawer open={createDrawerOpen}
                                 onClose={() => setCreateDrawerOpen(false)}
                                 onSuccess={handleCreateSuccess}/>
            <EditProjectDrawer open={editDrawerOpen}
                               project={editingProject}
                               onClose={() => {
                                   setEditDrawerOpen(false);
                                   setEditingProject(null);
                               }}
                               onSuccess={handleEditSuccess}/>
        </Layout>
    );
};

import React, {useState} from "react";
import {Layout, message, Modal, Menu} from "antd";
import {ExclamationCircleOutlined, ClockCircleOutlined, FolderOutlined, TeamOutlined} from "@ant-design/icons";
import type {Project} from "@Webapp/api/modules/project";
import {
    useDeleteProject,
    useMyAccessibleProjects,
    useMyCreatedProjects,
    useRecentlyAccessedProjects
} from "@Webapp/api/modules/project";
import "./project-management.scss";
import {ProjectList} from "./components/project-list/project-list.tsx";

const {Sider, Content} = Layout;

export type ProjectViewType = "myCreated" | "myAccessible" | "recentlyAccessed";

export const ProjectManagement: React.FC = () => {
    const [selectedView, setSelectedView] = useState<ProjectViewType>("myCreated");
    const [collapsed, setCollapsed] = useState(false);

    // 获取不同视图的项目数据
    const myCreatedProjects = useMyCreatedProjects();
    const myAccessibleProjects = useMyAccessibleProjects();
    const recentlyAccessedProjects = useRecentlyAccessedProjects();
    const {deleteProject} = useDeleteProject();

    // 根据当前视图获取对应的数据
    const getCurrentViewData = () => {
        switch (selectedView) {
            case "myCreated":
                return {
                    ...myCreatedProjects,
                    title: "我创建的项目",
                    emptyDescription: "您还没有创建任何项目"
                };
            case "myAccessible":
                return {
                    ...myAccessibleProjects,
                    title: "我可访问的项目",
                    emptyDescription: "暂无可访问的项目"
                };
            case "recentlyAccessed":
                return {
                    ...recentlyAccessedProjects,
                    title: "最近访问的项目",
                    emptyDescription: "暂无最近访问的项目"
                };
            default:
                return {
                    projects: [],
                    loading: false,
                    refetch: () => {
                    },
                    title: "项目列表",
                    emptyDescription: "暂无项目"
                };
        }
    };

    const currentViewData = getCurrentViewData();

    // 处理项目点击
    const handleProjectClick = (project: Project) => {
        message.info(`点击了项目: ${project.projectName}`);
        // TODO: 导航到项目详情页或执行其他操作
    };

    // 处理编辑项目
    const handleEditProject = (project: Project) => {
        message.info(`编辑项目: ${project.projectName}`);
        // TODO: 打开编辑弹窗
    };

    // 处理删除项目
    const handleDeleteProject = (project: Project) => {
        Modal.confirm({
            title: "确认删除",
            icon: <ExclamationCircleOutlined/>,
            content: `确定要删除项目 "${project.projectName}" 吗？此操作无法撤销。`,
            okText: "确认",
            okType: "danger",
            cancelText: "取消",
            onOk: async () => {
                try {
                    await deleteProject(project.id);
                    currentViewData.refetch();
                } catch (error) {
                    // 错误已在 hook 中处理
                }
            }
        });
    };

    // 处理新建项目
    const handleCreateProject = () => {
        message.info("新建项目");
        // TODO: 打开新建项目弹窗
    };

    // 处理刷新
    const handleRefresh = () => {
        currentViewData.refetch();
    };

    // 菜单项
    const menuItems = [
        {
            key: "myCreated",
            icon: <FolderOutlined/>,
            label: "我创建的项目"
        },
        {
            key: "myAccessible",
            icon: <TeamOutlined/>,
            label: "我可访问的项目"
        },
        {
            key: "recentlyAccessed",
            icon: <ClockCircleOutlined/>,
            label: "最近访问"
        }
    ];

    const handleMenuClick = ({key}: {
        key: string
    }) => {
        setSelectedView(key as ProjectViewType);
    };

    return (
        <Layout className="project-management">
            <Sider
                width={250}
                className="project-sider"
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
            >
                <div className="project-sidebar">
                    <Menu
                        mode="inline"
                        selectedKeys={[selectedView]}
                        items={menuItems}
                        onClick={handleMenuClick}
                        inlineCollapsed={collapsed}
                    />
                </div>
            </Sider>
            <Content className="project-content">
                <ProjectList
                    projects={currentViewData.projects}
                    loading={currentViewData.loading}
                    title={currentViewData.title}
                    emptyDescription={currentViewData.emptyDescription}
                    onClick={handleProjectClick}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                    onRefresh={handleRefresh}
                    onCreateNew={selectedView === "myCreated" ? handleCreateProject : undefined}
                />
            </Content>
        </Layout>
    );
};

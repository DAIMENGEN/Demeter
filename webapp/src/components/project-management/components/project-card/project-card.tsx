import type {MenuProps} from "antd";
import {Card, Dropdown, Space, Tag, Typography} from "antd";
import {CalendarOutlined, DeleteOutlined, EditOutlined, MoreOutlined, UserOutlined} from "@ant-design/icons";
import dayjs from "dayjs";
import type {Project} from "@Webapp/api/modules/project";
import {ProjectStatus, ProjectStatusLabels} from "@Webapp/api/modules/project";
import "./project-card.scss";
import React from "react";

const {Title, Text, Paragraph} = Typography;

interface ProjectCardProps {
    project: Project;
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
    onClick?: (project: Project) => void;
}

/**
 * 获取项目状态标签颜色
 */
const getStatusColor = (status: ProjectStatus): string => {
    const colorMap: Record<ProjectStatus, string> = {
        [ProjectStatus.PLANNING]: "blue",
        [ProjectStatus.IN_PROGRESS]: "green",
        [ProjectStatus.PAUSED]: "orange",
        [ProjectStatus.COMPLETED]: "purple",
        [ProjectStatus.CANCELLED]: "red"
    };
    return colorMap[status] || "default";
};

export const ProjectCard: React.FC<ProjectCardProps> = ({
                                                            project,
                                                            onEdit,
                                                            onDelete,
                                                            onClick
                                                        }) => {
    const menuItems: MenuProps["items"] = [
        {
            key: "edit",
            icon: <EditOutlined/>,
            label: "编辑",
            onClick: () => onEdit?.(project)
        },
        {
            type: "divider"
        },
        {
            key: "delete",
            icon: <DeleteOutlined/>,
            label: "删除",
            danger: true,
            onClick: () => onDelete?.(project)
        }
    ];

    const handleCardClick = () => {
        onClick?.(project);
    };

    return (
        <Card
            className="project-card"
            hoverable
            onClick={handleCardClick}
            extra={
                <Dropdown menu={{items: menuItems}} trigger={["click"]}>
                    <MoreOutlined
                        className="more-icon"
                        onClick={(e) => e.stopPropagation()}
                    />
                </Dropdown>
            }
        >
            <div className="card-header">
                <Title level={4} className="project-title" ellipsis={{rows: 1}}>
                    {project.projectName}
                </Title>
                <Tag color={getStatusColor(project.projectStatus)}>
                    {ProjectStatusLabels[project.projectStatus]}
                </Tag>
            </div>

            <Paragraph
                className="project-description"
                ellipsis={{rows: 2}}
                type="secondary"
            >
                {project.description || "暂无描述"}
            </Paragraph>

            <Space orientation="vertical" size="small" className="project-meta">
                <Space size="small">
                    <CalendarOutlined className="meta-icon"/>
                    <Text type="secondary" className="meta-text">
                        {dayjs(project.startDateTime).format("YYYY-MM-DD")}
                        {project.endDateTime &&
                            ` ~ ${dayjs(project.endDateTime).format("YYYY-MM-DD")}`}
                    </Text>
                </Space>

                <Space size="small">
                    <UserOutlined className="meta-icon"/>
                    <Text type="secondary" className="meta-text">
                        创建于 {dayjs(project.createDateTime).format("YYYY-MM-DD HH:mm")}
                    </Text>
                </Space>
            </Space>
        </Card>
    );
};

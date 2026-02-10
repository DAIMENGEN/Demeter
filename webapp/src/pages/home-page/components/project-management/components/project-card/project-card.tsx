import React, {useCallback, useMemo} from "react";
import type {MenuProps} from "antd";
import {Card, Dropdown, Space, Tag, Typography} from "antd";
import {
    CalendarOutlined,
    DeleteOutlined,
    EditOutlined,
    MoreOutlined,
    SafetyOutlined,
    UserOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import {useTranslation} from "react-i18next";
import type {Project} from "@Webapp/api/modules/project";
import {getProjectStatusLabel, ProjectStatus} from "@Webapp/api/modules/project";
import "./project-card.scss";

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
    const {t} = useTranslation();

    const handleCardClick = useCallback(() => {
        onClick?.(project);
    }, [onClick, project]);

    const handleEdit = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit?.(project);
    }, [onEdit, project]);

    const handlePermission = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        // TODO: 实现权限管理功能
        console.log("权限管理", project);
    }, [project]);

    const handleMoreClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    const moreMenuItems: MenuProps["items"] = useMemo(() => [
        {
            key: "delete",
            icon: <DeleteOutlined/>,
            label: t("common.delete"),
            danger: true,
            onClick: (e) => {
                e?.domEvent?.stopPropagation();
                onDelete?.(project);
            }
        }
    ], [t, onDelete, project]);

    const cardActions = useMemo(() => [
        <EditOutlined key="edit" onClick={handleEdit}/>,
        <SafetyOutlined key="permission" onClick={handlePermission}/>,
        <Dropdown menu={{items: moreMenuItems}} trigger={["click"]} key="more">
            <MoreOutlined onClick={handleMoreClick}/>
        </Dropdown>
    ], [handleEdit, handlePermission, handleMoreClick, moreMenuItems]);

    const cardTitle = useMemo(() => (
        <div className="card-header">
            <Title level={5} className="project-title" ellipsis={{rows: 1}} style={{margin: 0}}>
                {project.projectName}
            </Title>
            <Tag color={getStatusColor(project.projectStatus)}>
                {getProjectStatusLabel(project.projectStatus, t)}
            </Tag>
        </div>
    ), [project.projectName, project.projectStatus, t]);

    const dateRange = useMemo(() => {
        const startDate = dayjs(project.startDateTime).format("YYYY-MM-DD");
        const endDate = project.endDateTime
            ? dayjs(project.endDateTime).format("YYYY-MM-DD")
            : null;

        return {startDate, endDate};
    }, [project.startDateTime, project.endDateTime]);

    const createdDate = useMemo(() =>
            dayjs(project.createDateTime).format("YYYY-MM-DD HH:mm"),
        [project.createDateTime]
    );

    return (
        <Card
            className="project-card"
            hoverable
            onClick={handleCardClick}
            title={cardTitle}
            actions={cardActions}
        >
            <Paragraph
                className="project-description"
                ellipsis={{rows: 2}}
                type="secondary"
            >
                {project.description || t("project.noDescription")}
            </Paragraph>

            <Space orientation="vertical" size="small" className="project-meta">
                <Space size="small">
                    <CalendarOutlined className="meta-icon"/>
                    <Text type="secondary" className="meta-text">
                        {dateRange.startDate}
                        {dateRange.endDate ? (
                            ` ~ ${dateRange.endDate}`
                        ) : (
                            <>
                                {" ~ "}
                                <Tag style={{marginInlineStart: 4}} color="processing">
                                    {t("project.longTerm")}
                                </Tag>
                            </>
                        )}
                    </Text>
                </Space>

                <Space size="small">
                    <UserOutlined className="meta-icon"/>
                    <Text type="secondary" className="meta-text">
                        {t("project.createdAt", {date: createdDate})}
                    </Text>
                </Space>
            </Space>
        </Card>
    );
};

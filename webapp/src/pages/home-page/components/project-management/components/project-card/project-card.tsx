import React, {useCallback, useMemo} from "react";
import type {MenuProps} from "antd";
import {Card, Dropdown, Space, Tag, Typography} from "antd";
import {
    CalendarOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    MoreOutlined,
    SafetyOutlined,
    UserOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import {useTranslation} from "react-i18next";
import type {Project} from "@Webapp/api/modules/project";
import {getProjectStatusLabel, ProjectRole, ProjectStatus} from "@Webapp/api/modules/project";
import "./project-card.scss";

const {Title, Text, Paragraph} = Typography;

interface ProjectCardProps {
    project: Project;
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
    onClick?: (project: Project) => void;
    onPermission?: (project: Project) => void;
    isDragging?: boolean;
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
                                                            onClick,
                                                            onPermission,
                                                            isDragging = false
                                                        }) => {
    const {t} = useTranslation();

    // 权限判断：myRole 存在时根据角色控制，不存在时（如 myCreated 视图）默认允许
    const role = project.myRole;
    const canEdit = role == null || role <= ProjectRole.ADMIN;
    const canDelete = role == null || role <= ProjectRole.OWNER;
    const canManagePermission = role == null || role <= ProjectRole.ADMIN;

    const handleView = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onClick?.(project);
    }, [onClick, project]);

    const handleEdit = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit?.(project);
    }, [onEdit, project]);

    const handlePermission = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onPermission?.(project);
    }, [onPermission, project]);

    const handleMoreClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    const moreMenuItems: MenuProps["items"] = useMemo(() => {
        const items: MenuProps["items"] = [];
        if (canDelete && onDelete) {
            items.push({
                key: "delete",
                icon: <DeleteOutlined/>,
                label: t("common.delete"),
                danger: true,
                onClick: (e) => {
                    e?.domEvent?.stopPropagation();
                    onDelete?.(project);
                }
            });
        }
        return items;
    }, [t, onDelete, project, canDelete]);

    const cardActions = useMemo(() => {
        const actions: React.ReactNode[] = [
            <EyeOutlined key="view" onClick={handleView}/>,
        ];
        if (canEdit && onEdit) {
            actions.push(<EditOutlined key="edit" onClick={handleEdit}/>);
        }
        if (canManagePermission && onPermission) {
            actions.push(<SafetyOutlined key="permission" onClick={handlePermission}/>);
        }
        if (moreMenuItems && moreMenuItems.length > 0) {
            actions.push(
                <Dropdown menu={{items: moreMenuItems}} trigger={["click"]} key="more">
                    <MoreOutlined onClick={handleMoreClick}/>
                </Dropdown>
            );
        }
        return actions;
    }, [handleView, handleEdit, handlePermission, handleMoreClick, moreMenuItems, canEdit, canManagePermission, onEdit, onPermission]);

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
            className={`project-card ${isDragging ? 'dragging' : ''}`}
            hoverable={false}
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

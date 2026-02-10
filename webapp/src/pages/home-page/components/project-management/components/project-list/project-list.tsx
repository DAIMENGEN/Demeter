import {Button, Col, Empty, Row, Spin} from "antd";
import {PlusOutlined, ReloadOutlined} from "@ant-design/icons";
import type {Project} from "@Webapp/api/modules/project";
import {useTranslation} from "react-i18next";
import "./project-list.scss";
import React from "react";
import {ProjectCard} from "../project-card";

interface ProjectListProps {
    projects: Project[];
    loading?: boolean;
    title?: string;
    emptyDescription?: string;
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
    onClick?: (project: Project) => void;
    onRefresh?: () => void;
    onCreateNew?: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({
                                                            projects,
                                                            loading = false,
                                                            title,
                                                            emptyDescription,
                                                            onEdit,
                                                            onDelete,
                                                            onClick,
                                                            onRefresh,
                                                            onCreateNew
                                                        }) => {
    const {t} = useTranslation();

    return (
        <div className="project-list">
            <div className="list-header">
                <h2 className="list-title">{title || t("project.projectList")}</h2>
                <div className="list-actions">
                    {onRefresh && (
                        <Button
                            icon={<ReloadOutlined/>}
                            onClick={onRefresh}
                            loading={loading}
                        >
                            {t("project.refresh")}
                        </Button>
                    )}
                    {onCreateNew && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined/>}
                            onClick={onCreateNew}
                        >
                            {t("project.createProject")}
                        </Button>
                    )}
                </div>
            </div>

            <Spin spinning={loading}>
                {projects.length === 0 ? (
                    <div className="empty-container">
                        <Empty description={emptyDescription || t("project.noProjects")}/>
                    </div>
                ) : (
                    <Row gutter={[16, 16]} className="project-grid">
                        {projects.map((project) => (
                            <Col
                                key={project.id}
                                xs={24}
                                sm={12}
                                md={8}
                                lg={8}
                                xl={6}
                                xxl={4}
                            >
                                <ProjectCard
                                    project={project}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onClick={onClick}
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </Spin>
        </div>
    );
};

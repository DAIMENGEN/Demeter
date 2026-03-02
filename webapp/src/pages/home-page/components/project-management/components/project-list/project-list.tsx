import {Button, Col, Empty, Input, Row, Spin} from "antd";
import {PlusOutlined, ReloadOutlined, SearchOutlined} from "@ant-design/icons";
import type {Project} from "@Webapp/api/modules/project";
import {useTranslation} from "react-i18next";
import "./project-list.scss";
import React, {useState} from "react";
import {ProjectCard} from "../project-card";
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    rectSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";

interface SortableProjectCardProps {
    project: Project;
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
    onClick?: (project: Project) => void;
}

const SortableProjectCard: React.FC<SortableProjectCardProps> = ({
    project,
    onEdit,
    onDelete,
    onClick,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: project.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <ProjectCard
                project={project}
                onEdit={onEdit}
                onDelete={onDelete}
                onClick={onClick}
                isDragging={isDragging}
            />
        </div>
    );
};

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
    onSearch?: (keyword: string) => void;
    searchKeyword?: string;
    onReorder?: (projects: Project[]) => void;
    enableDragSort?: boolean;
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
                                                            onCreateNew,
                                                            onSearch,
                                                            searchKeyword = "",
                                                            onReorder,
                                                            enableDragSort = true,
                                                        }) => {
    const {t} = useTranslation();
    const [items, setItems] = useState<Project[]>(projects);

    // 当 projects 改变时更新本地状态
    React.useEffect(() => {
        setItems(projects);
    }, [projects]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 移动 8px 后才开始拖拽，避免误触
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);

            const newItems = arrayMove(items, oldIndex, newIndex);
            setItems(newItems);
            onReorder?.(newItems);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearch?.(e.target.value);
    };

    const handleSearch = (value: string) => {
        onSearch?.(value);
    };

    return (
        <div className="project-list">
            <div className="list-header">
                <h2 className="list-title">{title || t("project.projectList")}</h2>
                <div className="list-actions">
                    {onSearch && (
                        <Input.Search
                            placeholder={t("project.searchPlaceholder")}
                            allowClear
                            value={searchKeyword}
                            onChange={handleSearchChange}
                            onSearch={handleSearch}
                            style={{width: 240, marginRight: 8}}
                            prefix={<SearchOutlined/>}
                        />
                    )}
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
                {items.length === 0 ? (
                    <div className="empty-container">
                        <Empty description={emptyDescription || t("project.noProjects")}/>
                    </div>
                ) : enableDragSort ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={items.map(item => item.id)}
                            strategy={rectSortingStrategy}
                        >
                            <Row gutter={[16, 16]} className="project-grid">
                                {items.map((project) => (
                                    <Col
                                        key={project.id}
                                        xs={24}
                                        sm={12}
                                        md={8}
                                        lg={8}
                                        xl={6}
                                        xxl={4}
                                    >
                                        <SortableProjectCard
                                            project={project}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onClick={onClick}
                                        />
                                    </Col>
                                ))}
                            </Row>
                        </SortableContext>
                    </DndContext>
                ) : (
                    <Row gutter={[16, 16]} className="project-grid">
                        {items.map((project) => (
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

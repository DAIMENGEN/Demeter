import React, { useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { App, Card, Spin } from "antd";
import { Schedulant } from "schedulant";
import {
    useProjectById,
    useProjectTaskAttributeConfigs,
    useProjectTasks,
    useUpdateProjectTask,
    useReorderProjectTasks,
    useDeleteProjectTask,
} from "@Webapp/api/modules/project";
import { useSchedulantHeight } from "./hooks";
import {
    CreateTaskDrawer,
    EditTaskDrawer,
    GanttLegend,
    GanttToolbar,
    ProjectInfo,
    TaskAttributeConfigDrawer,
    TaskPreviewDrawer,
} from "./components";
import { useProjectDetailState } from "./use-project-detail-state";
import { useGanttData } from "./use-gantt-data";
import { useGanttHandlers } from "./use-gantt-handlers";
import type { GanttDataState } from "./constants";
import "schedulant/dist/schedulant.css";
import "./project-detail.scss";

const RESOURCE_LANE_CONTEXT_MENU_ITEMS = [
    { key: "create-subtask", label: "创建子任务" },
    { key: "create-checkpoint", label: "创建检查点 (Checkpoint)" },
    { key: "create-milestone", label: "创建里程碑 (Milestone)" },
    { key: "preview-task", label: "预览任务" },
    { key: "edit-task", label: "编辑任务" },
    { key: "delete-task", label: "删除任务" },
];

export const ProjectDetail: React.FC = () => {
    const { message, modal } = App.useApp();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const projectId = id ?? "";

    // 数据获取
    const { project, loading: projectLoading } = useProjectById(projectId);
    const { data: tasks, loading: tasksLoading, refetch: refetchTasks } = useProjectTasks(projectId, Boolean(projectId));
    const { update: updateTask } = useUpdateProjectTask();
    const { reorder: reorderTasks } = useReorderProjectTasks();
    const { remove: deleteTask, loading: deleteTaskLoading } = useDeleteProjectTask();
    const { data: attributeConfigs, loading: attributeConfigsLoading } = useProjectTaskAttributeConfigs(projectId, Boolean(projectId));

    // 状态管理
    const state = useProjectDetailState({
        projectId,
        attributeConfigs,
        attributeConfigsLoading,
    });

    // 乐观更新数据
    const [optimisticGanttData, setOptimisticGanttData] = useState<GanttDataState | null>(null);

    // 甘特图数据
    const { ganttData, resourceAreaColumns, parentTaskOptions, parentLabelMap } = useGanttData({
        tasks,
        colorRenderAttributeName: state.colorRenderAttributeName,
        activeColorMap: state.activeColorMap,
        attributeConfigs,
        selectedColumnKeys: state.selectedColumnKeys,
        availableColumns: state.availableColumns,
        optimisticGanttData,
    });

    // Drawer 状态
    const [taskAttributeDrawerOpen, setTaskAttributeDrawerOpen] = useState(false);
    const [createTaskDrawerOpen, setCreateTaskDrawerOpen] = useState(false);
    const [createTaskDefaultParentId, setCreateTaskDefaultParentId] = useState<string | undefined>(undefined);
    const [createTaskDefaultOrder, setCreateTaskDefaultOrder] = useState<number>(1.0);
    const [createTaskDefaultType, setCreateTaskDefaultType] = useState<number>(1);

    const [editTaskDrawerOpen, setEditTaskDrawerOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    const [previewTaskDrawerOpen, setPreviewTaskDrawerOpen] = useState(false);
    const [previewingTaskId, setPreviewingTaskId] = useState<string | null>(null);

    const previewingTask = useMemo(() => {
        if (!previewingTaskId) return null;
        return tasks.find((t) => t.id === previewingTaskId) ?? null;
    }, [previewingTaskId, tasks]);

    const editingTask = useMemo(() => {
        if (!editingTaskId) return null;
        return tasks.find((t) => t.id === editingTaskId) ?? null;
    }, [editingTaskId, tasks]);

    // 事件处理
    const handlers = useGanttHandlers({
        projectId,
        tasks,
        ganttData,
        ganttStartDate: state.ganttStartDate,
        ganttEndDate: state.ganttEndDate,
        viewType: state.viewType,
        deleteTaskLoading,
        setGanttStartDate: state.setGanttStartDate,
        setGanttEndDate: state.setGanttEndDate,
        setOptimisticGanttData,
        updateTask,
        reorderTasks,
        deleteTask,
        refetchTasks,
        message,
        modal,
        setCreateTaskDrawerOpen,
        setCreateTaskDefaultParentId,
        setCreateTaskDefaultOrder,
        setCreateTaskDefaultType,
        setEditTaskDrawerOpen,
        setEditingTaskId,
        setPreviewTaskDrawerOpen,
        setPreviewingTaskId,
    });

    // DOM refs
    const cardHeaderRef = useRef<HTMLDivElement>(null);
    const legendRef = useRef<HTMLDivElement>(null);
    const projectInfoRef = useRef<HTMLDivElement>(null);
    const { height: schedulantHeight, containerRef } = useSchedulantHeight(cardHeaderRef, legendRef);

    // 打开创建任务 Drawer
    const handleOpenCreateTask = () => {
        setCreateTaskDefaultParentId(undefined);
        setCreateTaskDefaultType(1);
        const maxOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.order)) : 0;
        setCreateTaskDefaultOrder(maxOrder + 1);
        setCreateTaskDrawerOpen(true);
    };

    return (
        <div ref={containerRef} className="project-detail">
            <Spin spinning={Boolean(projectId) && (projectLoading || tasksLoading)}>
                <Card
                    className="gantt-chart-card"
                    title={
                        <div ref={cardHeaderRef}>
                            <GanttToolbar
                                projectName={project?.projectName || ""}
                                viewType={state.viewType}
                                ganttStartDate={state.ganttStartDate}
                                ganttEndDate={state.ganttEndDate}
                                onViewTypeChange={state.setViewType}
                                onStartDateChange={state.setGanttStartDate}
                                onEndDateChange={state.setGanttEndDate}
                                onShiftLeft={handlers.handleShiftLeft}
                                onShiftRight={handlers.handleShiftRight}
                                onJumpToToday={handlers.handleJumpToToday}
                                onOpenTaskAttributeConfig={() => setTaskAttributeDrawerOpen(true)}
                                onOpenCreateTask={handleOpenCreateTask}
                                onBack={() => navigate("/home/project-management")}
                                lineHeightMode={state.lineHeightMode}
                                customLineHeight={state.customLineHeight}
                                slotMinWidthMode={state.slotMinWidthMode}
                                customSlotMinWidth={state.customSlotMinWidth}
                                actualLineHeight={state.actualLineHeight}
                                actualSlotMinWidth={state.actualSlotMinWidth}
                                availableColumns={state.availableColumns}
                                selectedColumnKeys={state.selectedColumnKeys}
                                onSelectedColumnKeysChange={state.setSelectedColumnKeysAndPersist}
                                onLineHeightModeChange={state.setLineHeightMode}
                                onCustomLineHeightChange={state.setCustomLineHeight}
                                onSlotMinWidthModeChange={state.setSlotMinWidthMode}
                                onCustomSlotMinWidthChange={state.setCustomSlotMinWidth}
                                attributeConfigs={attributeConfigs}
                                colorRenderAttributeName={state.colorRenderAttributeName}
                                onColorRenderAttributeNameChange={state.setColorRenderAttributeNameAndPersist}
                            />
                        </div>
                    }
                >
                    <div className="schedulant-container">
                        <div style={{ position: "relative" }}>
                            <Schedulant
                                start={state.ganttStartDate}
                                end={state.ganttEndDate}
                                editable={true}
                                selectable={true}
                                lineHeight={state.actualLineHeight}
                                slotMinWidth={state.actualSlotMinWidth}
                                schedulantViewType={state.viewType}
                                schedulantMaxHeight={schedulantHeight}
                                resources={ganttData.resources}
                                events={ganttData.events}
                                checkpoints={ganttData.checkpoints}
                                milestones={ganttData.milestones}
                                dragHintColor="rgb(66, 133, 244, 0.08)"
                                selectionColor="rgba(66, 133, 244, 0.08)"
                                resourceAreaWidth={"20%"}
                                resourceAreaColumns={resourceAreaColumns}
                                milestoneMove={handlers.handleMilestoneMove}
                                checkpointMove={handlers.handleCheckpointMove}
                                eventMove={handlers.handleEventMove}
                                eventResizeStart={(arg) => handlers.handleEventResize(arg, "start")}
                                eventResizeEnd={(arg) => handlers.handleEventResize(arg, "end")}
                                resourceLaneMove={handlers.handleResourceLaneMove}
                                enableResourceLaneContextMenu={true}
                                resourceLaneContextMenuItems={RESOURCE_LANE_CONTEXT_MENU_ITEMS}
                                resourceLaneContextMenuClick={handlers.handleResourceLaneContextMenuClick}
                            />
                        </div>

                        <GanttLegend ref={legendRef} items={state.legendItems} />

                        <ProjectInfo
                            ref={projectInfoRef}
                            startDateTime={project?.startDateTime || "加载中"}
                            endDateTime={project?.endDateTime}
                        />
                    </div>
                </Card>
            </Spin>

            <TaskAttributeConfigDrawer
                open={taskAttributeDrawerOpen}
                projectId={project?.id || ""}
                onClose={() => setTaskAttributeDrawerOpen(false)}
            />

            <TaskPreviewDrawer
                open={previewTaskDrawerOpen}
                task={previewingTask}
                attributeConfigs={attributeConfigs}
                attributeConfigsLoading={attributeConfigsLoading}
                parentLabelMap={parentLabelMap}
                onEdit={() => {
                    if (!previewingTaskId) return;
                    setEditingTaskId(previewingTaskId);
                    setEditTaskDrawerOpen(true);
                }}
                onClose={() => {
                    setPreviewTaskDrawerOpen(false);
                    setPreviewingTaskId(null);
                }}
            />

            <EditTaskDrawer
                open={editTaskDrawerOpen}
                projectId={project?.id || ""}
                task={editingTask}
                parentOptions={parentTaskOptions}
                onClose={() => {
                    setEditTaskDrawerOpen(false);
                    setEditingTaskId(null);
                }}
                onUpdated={async () => {
                    await refetchTasks();
                }}
            />

            <CreateTaskDrawer
                open={createTaskDrawerOpen}
                projectId={project?.id || ""}
                parentOptions={parentTaskOptions}
                defaultParentId={createTaskDefaultParentId}
                defaultOrder={createTaskDefaultOrder}
                defaultRange={{
                    start: state.ganttStartDate.startOf("day"),
                    end: state.ganttEndDate.startOf("day").add(7, "day"),
                }}
                defaultTaskType={createTaskDefaultType}
                onClose={() => setCreateTaskDrawerOpen(false)}
                onCreated={async () => {
                    await refetchTasks();
                }}
            />
        </div>
    );
};



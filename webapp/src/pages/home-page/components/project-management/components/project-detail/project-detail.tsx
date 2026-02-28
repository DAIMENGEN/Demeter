import React, {useCallback, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {Result404} from "@Webapp/components/result-404";
import {useDomRef} from "@Webapp/hooks";
import {useSchedulantHeight} from "./hooks/use-schedulant-height.ts";
import {useSchedulantData} from "./hooks/use-schedulant-data.ts";
import {App, Card, Spin} from "antd";
import type {
    CheckpointContextMenuArg,
    CheckpointMoveMountArg,
    EventContextMenuArg,
    EventMoveMountArg,
    EventResizeMountArg,
    MilestoneContextMenuArg,
    MilestoneMoveMountArg,
    ResourceLaneContextMenuArg,
    ResourceLaneMoveMountArg,
} from "schedulant";
import {Schedulant} from "schedulant";
import dayjs, {type Dayjs} from "dayjs";
import {
    ProjectTaskType,
    type UpdateProjectTaskParams,
    useProjectTaskActions,
} from "@Webapp/api";
import {
    DEFAULT_CUSTOM_LINE_HEIGHT,
    DEFAULT_CUSTOM_SLOT_MIN_WIDTH,
    DEFAULT_LINE_HEIGHT_MODE,
    DEFAULT_SLOT_MIN_WIDTH_MODE,
    LINE_HEIGHT_PRESETS,
    type LineHeightMode,
    SCHEDULANT_VIEW_DEFAULT_RANGE_MAP,
    SCHEDULANT_VIEW_UNIT_MAP,
    SLOT_MIN_WIDTH_PRESETS,
    type SlotMinWidthMode,
} from "./constants.ts";
import "schedulant/dist/schedulant.css";
import "./project-detail.scss";
import {toNaiveDateTimeString} from "../project-drawer/utils.ts";
import {
    CreateTaskDrawer,
    EditTaskDrawer,
    TaskPreviewDrawer
} from "./components/schedulant-toolbar/components/task-drawers/index.ts";
import {
    SchedulantToolbar,
} from "./components/schedulant-toolbar/schedulant-toolbar";
import {SchedulantLegend} from "./components/schedulant-legend";
import {SchedulantCaption} from "./components/schedulant-caption";
import type {SchedulantViewType} from "schedulant/dist/types/schedulant-view";

export const ProjectDetail: React.FC = () => {
    const {t} = useTranslation();
    const {message, modal} = App.useApp();
    const navigate = useNavigate();
    const {projectId} = useParams<{ projectId: string }>();
    const {updateTask, deleteTask} = useProjectTaskActions();
    const {
        project,
        projectLoading,
        tasks,
        tasksLoading,
        refetchTasks,
        attributeConfigs,
        attributeConfigsLoading,
        refetchAttributeConfigs,
        colorRenderAttributeName,
        setColorRenderAttributeName,
        availableColumns,
        selectedColumnKeys,
        setSelectedColumnKeys,
        legendItems,
        resources,
        events,
        milestones,
        checkpoints,
        resourceAreaColumns,
        parentOptions,
        parentLabelMap,
    } = useSchedulantData(projectId!);
    const taskContextMenuItems = useMemo(() => [
        {key: "create-subtask", label: t("task.createSubtask")},
        {key: "create-checkpoint", label: t("task.createCheckpoint")},
        {key: "create-milestone", label: t("task.createMilestone")},
        {key: "preview-task", label: t("common.preview")},
        {key: "edit-task", label: t("common.edit")},
        {key: "delete-task", label: t("common.delete")},
    ], [t]);
    const simpleTaskContextMenuItems = useMemo(() => [
        {key: "preview-task", label: t("common.preview")},
        {key: "edit-task", label: t("common.edit")},
        {key: "delete-task", label: t("common.delete")},
    ], [t]);

    // 视图状态
    const [schedulantViewType, setSchedulantViewType] = useState<SchedulantViewType>("Day");
    const [schedulantStartDate, setSchedulantStartDate] = useState<Dayjs>(dayjs().startOf("month"));
    const [schedulantEndDate, setSchedulantEndDate] = useState<Dayjs>(dayjs().startOf("month").add(SCHEDULANT_VIEW_DEFAULT_RANGE_MAP["Day"], "day"));

    // 显示配置状态
    const [lineHeightMode, setLineHeightMode] = useState<LineHeightMode>(DEFAULT_LINE_HEIGHT_MODE);
    const [customLineHeight, setCustomLineHeight] = useState(DEFAULT_CUSTOM_LINE_HEIGHT);
    const [slotMinWidthMode, setSlotMinWidthMode] = useState<SlotMinWidthMode>(DEFAULT_SLOT_MIN_WIDTH_MODE);
    const [customSlotMinWidth, setCustomSlotMinWidth] = useState(DEFAULT_CUSTOM_SLOT_MIN_WIDTH);

    // 计算实际行高和槽宽
    const actualLineHeight = useMemo(() => {
        if (lineHeightMode === "custom") return customLineHeight;
        return LINE_HEIGHT_PRESETS[lineHeightMode];
    }, [lineHeightMode, customLineHeight]);

    const actualSlotMinWidth = useMemo(() => {
        if (slotMinWidthMode === "custom") return customSlotMinWidth;
        return SLOT_MIN_WIDTH_PRESETS[slotMinWidthMode];
    }, [slotMinWidthMode, customSlotMinWidth]);

    // 创建任务 Drawer 状态
    const [createTaskDrawerOpen, setCreateTaskDrawerOpen] = useState(false);
    const [createTaskDefaultParentId, setCreateTaskDefaultParentId] = useState<string | undefined>(undefined);
    const [createTaskDefaultOrder, setCreateTaskDefaultOrder] = useState<number>(1.0);
    const [createTaskDefaultType, setCreateTaskDefaultType] = useState<number>(ProjectTaskType.DEFAULT);

    // 编辑任务 Drawer 状态
    const [editTaskDrawerOpen, setEditTaskDrawerOpen] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    // 预览任务 Drawer 状态
    const [previewTaskDrawerOpen, setPreviewTaskDrawerOpen] = useState(false);
    const [previewingTaskId, setPreviewingTaskId] = useState<string | null>(null);

    // 预览中的任务
    const previewingTask = useMemo(() => {
        if (!previewingTaskId) return null;
        return tasks.find((t) => t.id === previewingTaskId) ?? null;
    }, [previewingTaskId, tasks]);

    // 编辑中的任务
    const editingTask = useMemo(() => {
        if (!editingTaskId) return null;
        return tasks.find((t) => t.id === editingTaskId) ?? null;
    }, [editingTaskId, tasks]);

    if (!projectId) {
        return <Result404 returnPath={"/home/project-management"}/>
    }

    // ---- 视图控制 ----
    const handleViewTypeChange = useCallback((newViewType: SchedulantViewType) => {
        setSchedulantViewType(newViewType);
        const unit = SCHEDULANT_VIEW_UNIT_MAP[newViewType];
        const range = SCHEDULANT_VIEW_DEFAULT_RANGE_MAP[newViewType];
        const start = dayjs().startOf(unit as dayjs.OpUnitType);
        setSchedulantStartDate(start);
        setSchedulantEndDate(start.add(range, unit as dayjs.ManipulateType));
    }, []);

    const handleShiftLeft = useCallback(() => {
        const unit = SCHEDULANT_VIEW_UNIT_MAP[schedulantViewType];
        const range = SCHEDULANT_VIEW_DEFAULT_RANGE_MAP[schedulantViewType];
        setSchedulantStartDate((prev) => prev.subtract(range, unit as dayjs.ManipulateType));
        setSchedulantEndDate((prev) => prev.subtract(range, unit as dayjs.ManipulateType));
    }, [schedulantViewType]);

    const handleShiftRight = useCallback(() => {
        const unit = SCHEDULANT_VIEW_UNIT_MAP[schedulantViewType];
        const range = SCHEDULANT_VIEW_DEFAULT_RANGE_MAP[schedulantViewType];
        setSchedulantStartDate((prev) => prev.add(range, unit as dayjs.ManipulateType));
        setSchedulantEndDate((prev) => prev.add(range, unit as dayjs.ManipulateType));
    }, [schedulantViewType]);

    const handleJumpToToday = useCallback(() => {
        const unit = SCHEDULANT_VIEW_UNIT_MAP[schedulantViewType];
        const range = SCHEDULANT_VIEW_DEFAULT_RANGE_MAP[schedulantViewType];
        const start = dayjs().startOf(unit as dayjs.OpUnitType);
        setSchedulantStartDate(start);
        setSchedulantEndDate(start.add(range, unit as dayjs.ManipulateType));
    }, [schedulantViewType]);

    // ---- 打开创建任务 Drawer ----
    const handleOpenCreateTask = useCallback(() => {
        setCreateTaskDefaultParentId(undefined);
        setCreateTaskDefaultType(ProjectTaskType.DEFAULT);
        const maxOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.order)) : 0;
        setCreateTaskDefaultOrder(maxOrder + 1);
        setCreateTaskDrawerOpen(true);
    }, [tasks]);

    // ---- 任务更新辅助 ----
    const doUpdateTask = useCallback(async (taskId: string, params: UpdateProjectTaskParams) => {
        try {
            await updateTask(projectId, taskId, params);
            refetchTasks();
        } catch (e) {
            console.error("Update task failed:", e);
            message.error(t("task.updateTaskFailed"));
        }
    }, [projectId, updateTask, refetchTasks, message]);

    // ---- Schedulant 事件回调 ----
    const handleEventMove = useCallback((arg: EventMoveMountArg) => {
        const taskId = arg.eventApi.getId();
        void doUpdateTask(taskId, {
            startDateTime: toNaiveDateTimeString(arg.startDate),
            endDateTime: toNaiveDateTimeString(arg.endDate),
        });
    }, [doUpdateTask]);

    const handleEventResizeStart = useCallback((arg: EventResizeMountArg) => {
        const taskId = arg.eventApi.getId();
        void doUpdateTask(taskId, {
            startDateTime: toNaiveDateTimeString(arg.date),
        });
    }, [doUpdateTask]);

    const handleEventResizeEnd = useCallback((arg: EventResizeMountArg) => {
        const taskId = arg.eventApi.getId();
        void doUpdateTask(taskId, {
            endDateTime: toNaiveDateTimeString(arg.date),
        });
    }, [doUpdateTask]);

    const handleMilestoneMove = useCallback((arg: MilestoneMoveMountArg) => {
        const taskId = arg.milestoneApi.getId();
        void doUpdateTask(taskId, {
            startDateTime: toNaiveDateTimeString(arg.date),
            endDateTime: toNaiveDateTimeString(arg.date),
        });
    }, [doUpdateTask]);

    const handleCheckpointMove = useCallback((arg: CheckpointMoveMountArg) => {
        const taskId = arg.checkpointApi.getId();
        void doUpdateTask(taskId, {
            startDateTime: toNaiveDateTimeString(arg.date),
            endDateTime: toNaiveDateTimeString(arg.date),
        });
    }, [doUpdateTask]);

    const handleResourceLaneMove = useCallback((arg: ResourceLaneMoveMountArg) => {
        // 资源行拖拽排序 - 更新父任务和顺序
        const draggedId = arg.draggedResourceApi.getId();
        const targetId = arg.targetResourceApi.getId();
        const position = arg.position;

        const targetTask = tasks.find((t) => t.id === targetId);
        if (!targetTask) return;

        let newParentId: string | null;
        let newOrder: number;

        if (position === "child") {
            newParentId = targetId;
            const children = tasks.filter((t) => t.parentId === targetId);
            newOrder = children.length > 0 ? Math.max(...children.map((c) => c.order)) + 1 : 1;
        } else {
            newParentId = targetTask.parentId ?? null;
            const siblings = tasks.filter((t) => (t.parentId ?? null) === newParentId && t.id !== draggedId);
            const targetIndex = siblings.findIndex((t) => t.id === targetId);
            if (position === "before") {
                const prevOrder = targetIndex > 0 ? siblings[targetIndex - 1].order : targetTask.order - 1;
                newOrder = (prevOrder + targetTask.order) / 2;
            } else {
                const nextOrder = targetIndex < siblings.length - 1 ? siblings[targetIndex + 1].order : targetTask.order + 1;
                newOrder = (targetTask.order + nextOrder) / 2;
            }
        }

        void doUpdateTask(draggedId, {parentId: newParentId, order: newOrder});
    }, [tasks, doUpdateTask]);

    // ---- 右键菜单 ----
    const handleContextMenuAction = useCallback((taskId: string, key: string) => {
        const task = tasks.find((t) => t.id === taskId);
        if (!task && key !== "create-subtask") return;

        switch (key) {
            case "create-subtask": {
                setCreateTaskDefaultParentId(taskId);
                setCreateTaskDefaultType(ProjectTaskType.DEFAULT);
                const children = tasks.filter((t) => t.parentId === taskId);
                const maxOrder = children.length > 0 ? Math.max(...children.map((c) => c.order)) : 0;
                setCreateTaskDefaultOrder(maxOrder + 1);
                setCreateTaskDrawerOpen(true);
                break;
            }
            case "create-checkpoint": {
                setCreateTaskDefaultParentId(taskId);
                setCreateTaskDefaultType(ProjectTaskType.CHECKPOINT);
                setCreateTaskDefaultOrder(1);
                setCreateTaskDrawerOpen(true);
                break;
            }
            case "create-milestone": {
                setCreateTaskDefaultParentId(taskId);
                setCreateTaskDefaultType(ProjectTaskType.MILESTONE);
                setCreateTaskDefaultOrder(1);
                setCreateTaskDrawerOpen(true);
                break;
            }
            case "preview-task": {
                setPreviewingTaskId(taskId);
                setPreviewTaskDrawerOpen(true);
                break;
            }
            case "edit-task": {
                setEditingTaskId(taskId);
                setEditTaskDrawerOpen(true);
                break;
            }
            case "delete-task": {
                modal.confirm({
                    title: t("task.deleteConfirmTitle"),
                    content: t("task.deleteConfirm", {name: task?.taskName}),
                    okText: t("common.delete"),
                    okType: "danger",
                    cancelText: t("common.cancel"),
                    onOk: async () => {
                        try {
                            await deleteTask(projectId, taskId);
                            refetchTasks();
                            message.success(t("task.deleteSuccess"));
                        } catch {
                            message.error(t("task.deleteFailed"));
                        }
                    },
                });
                break;
            }
        }
    }, [tasks, projectId, deleteTask, refetchTasks, message, modal]);

    const handleResourceLaneContextMenuClick = useCallback((arg: ResourceLaneContextMenuArg) => {
        handleContextMenuAction(arg.resourceApi.getId(), arg.key);
    }, [handleContextMenuAction]);

    const handleEventContextMenuClick = useCallback((arg: EventContextMenuArg) => {
        handleContextMenuAction(arg.eventApi.getId(), arg.key);
    }, [handleContextMenuAction]);

    const handleCheckpointContextMenuClick = useCallback((arg: CheckpointContextMenuArg) => {
        handleContextMenuAction(arg.checkpointApi.getId(), arg.key);
    }, [handleContextMenuAction]);

    const handleMilestoneContextMenuClick = useCallback((arg: MilestoneContextMenuArg) => {
        handleContextMenuAction(arg.milestoneApi.getId(), arg.key);
    }, [handleContextMenuAction]);

    const cardHeaderRef = useDomRef<HTMLDivElement>();
    const schedulantLegendRef = useDomRef<HTMLDivElement>();
    const schedulantCaptionRef = useDomRef<HTMLDivElement>();
    const {height: schedulantHeight, containerRef} = useSchedulantHeight(cardHeaderRef, schedulantLegendRef);

    return (
        <div ref={containerRef} className={"project-detail"}>
            <Spin spinning={projectLoading || tasksLoading}>
                <Card className={"schedulant-chart-card"}
                      title={<SchedulantToolbar ref={cardHeaderRef}
                                                projectId={projectId}
                                                schedulantViewType={schedulantViewType}
                                                projectName={project?.projectName || t("task.defaultProjectName")}
                                                schedulantStartDate={schedulantStartDate}
                                                schedulantEndDate={schedulantEndDate}
                                                onViewTypeChange={handleViewTypeChange}
                                                onStartDateChange={setSchedulantStartDate}
                                                onEndDateChange={setSchedulantEndDate}
                                                onShiftLeft={handleShiftLeft}
                                                onShiftRight={handleShiftRight}
                                                onJumpToToday={handleJumpToToday}
                                                onOpenCreateTask={handleOpenCreateTask}
                                                onBack={() => navigate("/home/project-management")}
                                                lineHeightMode={lineHeightMode}
                                                customLineHeight={customLineHeight}
                                                slotMinWidthMode={slotMinWidthMode}
                                                customSlotMinWidth={customSlotMinWidth}
                                                actualLineHeight={actualLineHeight}
                                                actualSlotMinWidth={actualSlotMinWidth}
                                                availableColumns={availableColumns}
                                                selectedColumnKeys={selectedColumnKeys}
                                                onSelectedColumnKeysChange={setSelectedColumnKeys}
                                                onLineHeightModeChange={setLineHeightMode}
                                                onCustomLineHeightChange={setCustomLineHeight}
                                                onSlotMinWidthModeChange={setSlotMinWidthMode}
                                                onCustomSlotMinWidthChange={setCustomSlotMinWidth}
                                                attributeConfigs={attributeConfigs}
                                                attributeConfigsLoading={attributeConfigsLoading}
                                                colorRenderAttributeName={colorRenderAttributeName}
                                                onColorRenderAttributeNameChange={setColorRenderAttributeName}
                                                refetchAttributeConfigs={refetchAttributeConfigs}/>}>
                    <div className={"schedulant-container"}>
                        <Schedulant start={schedulantStartDate}
                                    end={schedulantEndDate}
                                    editable={true}
                                    selectable={true}
                                    lineHeight={actualLineHeight}
                                    slotMinWidth={actualSlotMinWidth}
                                    dragHintColor="rgba(92, 229, 242, 0.4)"
                                    selectionColor="rgba(100, 181, 246, 0.4)"
                                    resourceAreaWidth={"20%"}
                                    resourceAreaColumns={resourceAreaColumns}
                                    schedulantMaxHeight={schedulantHeight}
                                    schedulantViewType={schedulantViewType}
                                    events={events}
                                    resources={resources}
                                    milestones={milestones}
                                    checkpoints={checkpoints}
                                    eventMove={handleEventMove}
                                    eventResizeStart={handleEventResizeStart}
                                    eventResizeEnd={handleEventResizeEnd}
                                    milestoneMove={handleMilestoneMove}
                                    checkpointMove={handleCheckpointMove}
                                    resourceLaneMove={handleResourceLaneMove}
                                    enableEventContextMenu={true}
                                    eventContextMenuItems={taskContextMenuItems}
                                    eventContextMenuClick={handleEventContextMenuClick}
                                    enableResourceLaneContextMenu={true}
                                    resourceLaneContextMenuItems={taskContextMenuItems}
                                    resourceLaneContextMenuClick={handleResourceLaneContextMenuClick}
                                    enableCheckpointContextMenu={true}
                                    checkpointContextMenuItems={simpleTaskContextMenuItems}
                                    checkpointContextMenuClick={handleCheckpointContextMenuClick}
                                    enableMilestoneContextMenu={true}
                                    milestoneContextMenuItems={simpleTaskContextMenuItems}
                                    milestoneContextMenuClick={handleMilestoneContextMenuClick}
                                    />
                        <SchedulantLegend ref={schedulantLegendRef} items={legendItems}/>
                        <SchedulantCaption ref={schedulantCaptionRef}
                                           startDateTime={project?.startDateTime ? dayjs(project.startDateTime) : dayjs()}
                                           endDateTime={project?.endDateTime ? dayjs(project.endDateTime) : null}/>
                    </div>
                </Card>
            </Spin>

            <CreateTaskDrawer
                open={createTaskDrawerOpen}
                projectId={projectId}
                parentOptions={parentOptions}
                defaultParentId={createTaskDefaultParentId}
                defaultOrder={createTaskDefaultOrder}
                defaultTaskType={createTaskDefaultType}
                defaultRange={{
                    start: schedulantStartDate.startOf("day"),
                    end: schedulantStartDate.startOf("day").add(7, "day"),
                }}
                onSuccess={() => {
                    refetchTasks();
                    message.success(t("task.createSuccess"));
                }}
                onClose={() => setCreateTaskDrawerOpen(false)}
            />

            <EditTaskDrawer
                open={editTaskDrawerOpen}
                projectId={projectId}
                task={editingTask}
                parentOptions={parentOptions}
                onSuccess={() => {
                    refetchTasks();
                    message.success(t("task.updateSuccess"));
                }}
                onClose={() => {
                    setEditTaskDrawerOpen(false);
                    setEditingTaskId(null);
                }}
            />

            <TaskPreviewDrawer
                open={previewTaskDrawerOpen}
                task={previewingTask}
                attributeConfigs={attributeConfigs}
                attributeConfigsLoading={attributeConfigsLoading}
                parentLabelMap={parentLabelMap}
                onEdit={() => {
                    if (!previewingTaskId) return;
                    setPreviewTaskDrawerOpen(false);
                    setPreviewingTaskId(null);
                    setEditingTaskId(previewingTaskId);
                    setEditTaskDrawerOpen(true);
                }}
                onClose={() => {
                    setPreviewTaskDrawerOpen(false);
                    setPreviewingTaskId(null);
                }}
            />
        </div>
    )
}
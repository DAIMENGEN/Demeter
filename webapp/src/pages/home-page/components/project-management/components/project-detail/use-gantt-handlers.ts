import { useCallback } from "react";
import dayjs from "dayjs";
import type {
    CheckpointMoveMountArg,
    EventMoveMountArg,
    EventResizeMountArg,
    MilestoneMoveMountArg,
    ResourceLaneMoveMountArg,
} from "schedulant";
import type { ProjectTask } from "@Webapp/api/modules/project";
import type { GanttDataState } from "./constants";
import type { ViewType } from "./components";
import { viewDefaultRangeMap, viewUnitMap } from "./components";
import { shiftRangeByViewStep } from "./components/gantt-date-navigation";
import { calcFractionalOrder } from "./utils";

type UseGanttHandlersOptions = {
    projectId: string;
    tasks: ProjectTask[];
    ganttData: GanttDataState;
    ganttStartDate: dayjs.Dayjs;
    ganttEndDate: dayjs.Dayjs;
    viewType: ViewType;
    deleteTaskLoading: boolean;
    setGanttStartDate: (date: dayjs.Dayjs) => void;
    setGanttEndDate: (date: dayjs.Dayjs) => void;
    setOptimisticGanttData: React.Dispatch<React.SetStateAction<GanttDataState | null>>;
    updateTask: (projectId: string, taskId: string, data: Record<string, unknown>) => Promise<unknown>;
    reorderTasks: (projectId: string, params: { parentId: string | null }) => Promise<unknown>;
    deleteTask: (projectId: string, taskId: string) => Promise<unknown>;
    refetchTasks: () => Promise<unknown>;
    message: { success: (msg: string) => void; error: (msg: string) => void };
    modal: { confirm: (config: {
        title: string;
        content: string;
        okText: string;
        okButtonProps: { danger: boolean };
        cancelText: string;
        onOk: () => Promise<void>;
    }) => void };
    // Drawer 控制
    setCreateTaskDrawerOpen: (open: boolean) => void;
    setCreateTaskDefaultParentId: (id: string | undefined) => void;
    setCreateTaskDefaultOrder: (order: number) => void;
    setCreateTaskDefaultType: (type: number) => void;
    setEditTaskDrawerOpen: (open: boolean) => void;
    setEditingTaskId: (id: string | null) => void;
    setPreviewTaskDrawerOpen: (open: boolean) => void;
    setPreviewingTaskId: (id: string | null) => void;
};

export const useGanttHandlers = ({
    projectId,
    tasks,
    ganttData,
    ganttStartDate,
    ganttEndDate,
    viewType,
    deleteTaskLoading,
    setGanttStartDate,
    setGanttEndDate,
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
}: UseGanttHandlersOptions) => {
    // 向前移动时间范围（向左）
    const handleShiftLeft = useCallback(() => {
        if (!ganttStartDate || !ganttEndDate) return;
        const next = shiftRangeByViewStep(ganttStartDate, ganttEndDate, viewType, -1);
        setGanttStartDate(next.start);
        setGanttEndDate(next.end);
    }, [ganttStartDate, ganttEndDate, viewType, setGanttStartDate, setGanttEndDate]);

    // 向后移动时间范围（向右）
    const handleShiftRight = useCallback(() => {
        if (!ganttStartDate || !ganttEndDate) return;
        const next = shiftRangeByViewStep(ganttStartDate, ganttEndDate, viewType, 1);
        setGanttStartDate(next.start);
        setGanttEndDate(next.end);
    }, [ganttStartDate, ganttEndDate, viewType, setGanttStartDate, setGanttEndDate]);

    // 跳转到今天
    const handleJumpToToday = useCallback(() => {
        const unit = viewUnitMap[viewType];
        const range = viewDefaultRangeMap[viewType];
        setGanttStartDate(dayjs());
        setGanttEndDate(dayjs().add(range, unit as dayjs.ManipulateType));
    }, [viewType, setGanttStartDate, setGanttEndDate]);

    // 事件大小调整
    const handleEventResize = useCallback(
        (eventResizeMountArg: EventResizeMountArg, field: "start" | "end") => {
            const { date, eventApi } = eventResizeMountArg;
            const targetId = eventApi.getId();
            void (async () => {
                try {
                    const parentId = eventApi.getResourceApi().getParentId();
                    const payload: Record<string, string> = {
                        [field === "start" ? "startDateTime" : "endDateTime"]: date.format("YYYY-MM-DDTHH:mm:ss"),
                    };
                    if (parentId.isDefined()) {
                        payload["parentId"] = parentId.get();
                    }
                    await updateTask(projectId, targetId, payload);
                    await refetchTasks();
                    setOptimisticGanttData(null);
                } catch {
                    await refetchTasks();
                    setOptimisticGanttData(null);
                }
            })();
        },
        [projectId, updateTask, refetchTasks, setOptimisticGanttData]
    );

    // 里程碑移动
    const handleMilestoneMove = useCallback(
        (milestoneMoveMountArg: MilestoneMoveMountArg) => {
            const { date, milestoneApi } = milestoneMoveMountArg;
            const targetId = milestoneApi.getId();
            const parentId = milestoneApi.getResourceId();
            void (async () => {
                try {
                    const dt = date.format("YYYY-MM-DDTHH:mm:ss");
                    await updateTask(projectId, targetId, {
                        startDateTime: dt,
                        endDateTime: dt,
                        parentId: parentId,
                    });
                    await refetchTasks();
                } catch {
                    await refetchTasks();
                }
            })();
        },
        [projectId, updateTask, refetchTasks]
    );

    // 检查点移动
    const handleCheckpointMove = useCallback(
        (checkpointMoveMountArg: CheckpointMoveMountArg) => {
            const { date, checkpointApi } = checkpointMoveMountArg;
            const targetId = checkpointApi.getId();
            const parentId = checkpointApi.getResourceId();
            void (async () => {
                try {
                    const dt = date.format("YYYY-MM-DDTHH:mm:ss");
                    await updateTask(projectId, targetId, {
                        startDateTime: dt,
                        endDateTime: dt,
                        parentId: parentId,
                    });
                    await refetchTasks();
                } catch {
                    await refetchTasks();
                }
            })();
        },
        [projectId, updateTask, refetchTasks]
    );

    // 事件移动
    const handleEventMove = useCallback(
        (eventMoveMountArg: EventMoveMountArg) => {
            const { startDate, endDate, eventApi } = eventMoveMountArg;
            const targetId = eventApi.getId();
            const parentId = eventApi.getResourceId();
            void (async () => {
                try {
                    await updateTask(projectId, targetId, {
                        startDateTime: startDate.format("YYYY-MM-DDTHH:mm:ss"),
                        endDateTime: endDate.format("YYYY-MM-DDTHH:mm:ss"),
                        parentId: parentId,
                    });
                    await refetchTasks();
                } catch {
                    await refetchTasks();
                }
            })();
        },
        [projectId, updateTask, refetchTasks]
    );

    // 资源行移动
    const handleResourceLaneMove = useCallback(
        (resourceLaneMoveArg: ResourceLaneMoveMountArg) => {
            const { draggedResourceApi, targetResourceApi, position } = resourceLaneMoveArg;
            const draggedId = draggedResourceApi.getId();
            const targetId = targetResourceApi.getId();

            const draggedTask = tasks.find((t) => t.id === draggedId);
            const targetTask = tasks.find((t) => t.id === targetId);
            if (!draggedTask || !targetTask) return;

            const oldParentId = draggedTask.parentId ?? null;
            const newParentId =
                position === "child" ? targetTask.id : (targetTask.parentId ?? null);

            const siblings = tasks
                .filter((t) => (t.parentId ?? null) === newParentId && t.id !== draggedId)
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            const targetIndex = siblings.findIndex((t) => t.id === targetId);

            let newOrder: number | null = draggedTask.order ?? null;
            if (position === "before") {
                const next = targetIndex >= 0 ? siblings[targetIndex] : undefined;
                const prev = targetIndex > 0 ? siblings[targetIndex - 1] : undefined;
                newOrder = calcFractionalOrder(prev?.order ?? undefined, next?.order ?? undefined);
            } else if (position === "after") {
                const prev = targetIndex >= 0 ? siblings[targetIndex] : siblings[siblings.length - 1];
                const next =
                    targetIndex >= 0 && targetIndex + 1 < siblings.length
                        ? siblings[targetIndex + 1]
                        : undefined;
                newOrder = calcFractionalOrder(prev?.order ?? undefined, next?.order ?? undefined);
            } else {
                const last = siblings[siblings.length - 1];
                newOrder = (last?.order ?? 0) + 1;
            }

            // optimistic UI update
            setOptimisticGanttData((prev) => {
                const base = prev ?? ganttData;
                const newResources = [...base.resources];
                const draggedIndex = newResources.findIndex((r) => r.id === draggedId);
                if (draggedIndex === -1) return base;

                newResources[draggedIndex] = {
                    ...newResources[draggedIndex],
                    parentId: newParentId ?? undefined,
                    extendedProps: {
                        ...(newResources[draggedIndex].extendedProps as Record<string, unknown>),
                        order: newOrder ?? undefined,
                    },
                };

                return { ...base, resources: newResources };
            });

            void (async () => {
                try {
                    await updateTask(projectId, draggedId, {
                        parentId: newParentId,
                        order: newOrder,
                    });

                    await reorderTasks(projectId, { parentId: oldParentId });
                    if (newParentId !== oldParentId) {
                        await reorderTasks(projectId, { parentId: newParentId });
                    }

                    await refetchTasks();
                    setOptimisticGanttData(null);
                } catch {
                    await refetchTasks();
                    setOptimisticGanttData(null);
                }
            })();
        },
        [projectId, tasks, ganttData, updateTask, reorderTasks, refetchTasks, setOptimisticGanttData]
    );

    // 右键菜单点击
    const handleResourceLaneContextMenuClick = useCallback(
        (menuArg: { key: string; resourceApi: { getId: () => string; getTitle: () => string; getParentId: () => { isDefined?: () => boolean; get: () => string } } }) => {
            const { key, resourceApi } = menuArg;

            const taskId = resourceApi.getId();
            const taskName = resourceApi.getTitle();
            const parentIdOption = resourceApi.getParentId();
            const parentId = parentIdOption?.isDefined?.() ? parentIdOption.get() : null;

            const calcSiblingMaxOrder = (pid: string) => {
                const siblings = tasks.filter((t) => t.parentId === pid);
                return siblings.length > 0 ? Math.max(...siblings.map((t) => t.order)) : 0;
            };

            switch (key) {
                case "create-subtask": {
                    setCreateTaskDefaultParentId(taskId);
                    setCreateTaskDefaultType(1);
                    setCreateTaskDefaultOrder(calcSiblingMaxOrder(taskId) + 1);
                    setCreateTaskDrawerOpen(true);
                    return;
                }
                case "create-checkpoint": {
                    setCreateTaskDefaultParentId(taskId);
                    setCreateTaskDefaultType(3);
                    setCreateTaskDefaultOrder(calcSiblingMaxOrder(taskId) + 1);
                    setCreateTaskDrawerOpen(true);
                    return;
                }
                case "create-milestone": {
                    setCreateTaskDefaultParentId(taskId);
                    setCreateTaskDefaultType(2);
                    setCreateTaskDefaultOrder(calcSiblingMaxOrder(taskId) + 1);
                    setCreateTaskDrawerOpen(true);
                    return;
                }
                case "preview-task": {
                    const fullTask = tasks.find((t) => t.id === taskId);
                    if (!fullTask) {
                        void refetchTasks();
                        return;
                    }
                    setPreviewingTaskId(taskId);
                    setPreviewTaskDrawerOpen(true);
                    return;
                }
                case "edit-task": {
                    const fullTask = tasks.find((t) => t.id === taskId);
                    if (!fullTask) {
                        void refetchTasks();
                        return;
                    }
                    setEditingTaskId(taskId);
                    setEditTaskDrawerOpen(true);
                    return;
                }
                case "delete-task": {
                    if (deleteTaskLoading) return;

                    modal.confirm({
                        title: "确认删除任务？",
                        content: `将删除「${taskName}」以及其所有子任务。`,
                        okText: "删除",
                        okButtonProps: { danger: true },
                        cancelText: "取消",
                        onOk: async () => {
                            try {
                                await deleteTask(projectId, taskId);
                                await reorderTasks(projectId, { parentId });
                                await refetchTasks();
                                message.success("删除成功");
                            } catch (e: unknown) {
                                const err = e as { message?: string };
                                message.error(err?.message ?? "删除失败");
                                await refetchTasks();
                                throw e;
                            }
                        },
                    });
                    return;
                }
            }
        },
        [
            tasks,
            deleteTaskLoading,
            projectId,
            deleteTask,
            reorderTasks,
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
        ]
    );

    return {
        handleShiftLeft,
        handleShiftRight,
        handleJumpToToday,
        handleEventResize,
        handleMilestoneMove,
        handleCheckpointMove,
        handleEventMove,
        handleResourceLaneMove,
        handleResourceLaneContextMenuClick,
    };
};

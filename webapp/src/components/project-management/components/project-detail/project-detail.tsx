import React, {useState, useEffect, useRef, useMemo} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {Button, Card, Result, Spin, Space} from "antd";
import dayjs from "dayjs";
import {
    type Checkpoint,
    type Event,
    type EventResizeMountArg,
    type Milestone,
    type Resource,
    type CheckpointMoveMountArg,
    type EventMoveMountArg,
    type MilestoneMoveMountArg,
    type ResourceAreaColumn,
    Schedulant
} from "schedulant";
import {TaskType, useProjectById, useTasks, useUpdateTask, useReorderTasks} from "@Webapp/api/modules/project";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import weekOfYear from "dayjs/plugin/weekOfYear";
import weekYear from "dayjs/plugin/weekYear";
import {useSchedulantHeight} from "./hooks";
import {
    GanttToolbar,
    GanttLegend,
    ProjectInfo,
    TaskAttributeConfigDrawer,
    CreateTaskDrawer,
    type ViewType,
    type LegendItem,
    viewUnitMap,
    viewDefaultRangeMap
} from "./components";
import "schedulant/dist/schedulant.css";
import "./project-detail.scss";

dayjs.extend(isSameOrBefore);
dayjs.extend(quarterOfYear);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);

/**
 * Backend expects chrono::NaiveDateTime which can't parse ISO strings with milliseconds/timezone.
 * Use a stable 'YYYY-MM-DDTHH:mm:ss' format.
 */
const toNaiveDateTimeString = (value: Date | dayjs.Dayjs) => {
    const d = dayjs(value);
    return d.format("YYYY-MM-DDTHH:mm:ss");
};

const safeDayjs = (value: string) => {
    const d = dayjs(value);
    return d.isValid() ? d : dayjs();
};

const tasksToSchedulantModels = (tasks: import("@Webapp/api/modules/project").Task[]) => {
    const resources: Resource[] = tasks.map((t) => ({
        id: t.id,
        title: t.taskName,
        parentId: t.parentId ?? undefined,
        extendedProps: {
            order: t.order ?? undefined
        }
    }));

    const events: Event[] = [];
    const milestones: Milestone[] = [];
    const checkpoints: Checkpoint[] = [];

    for (const t of tasks) {
        const start = safeDayjs(t.startDateTime);
        const end = safeDayjs(t.endDateTime);

        if (t.taskType === TaskType.MILESTONE) {
            milestones.push({
                id: t.id,
                title: t.taskName,
                time: start,
                status: "Success",
                resourceId: t.id
            });
            continue;
        }

        if (t.taskType === TaskType.CHECKPOINT) {
            checkpoints.push({
                id: t.id,
                title: t.taskName,
                color: "green",
                time: start,
                resourceId: t.id
            });
            continue;
        }

        events.push({
            id: t.id,
            title: t.taskName,
            color: "rgba(0,0,0,0.57)",
            start,
            end: end.isBefore(start) ? start : end,
            resourceId: t.id
        });
    }

    return {resources, events, milestones, checkpoints};
};

const calcFractionalOrder = (prev?: number, next?: number) => {
    if (prev != null && next != null) return (prev + next) / 2;
    if (prev != null) return prev + 1;
    if (next != null) return next - 1;
    return 0;
};

type ResourceLaneMovePayload = {
    // matches schedulant ResourceLaneMoveMountArg shape used by resourceLaneMove callback
    draggedResourceApi: { getId: () => string };
    targetResourceApi: { getId: () => string };
    position: "child" | "before" | "after";
};

// 图例数据
const legendItems: LegendItem[] = [
    { color: "#FF6F61", label: "核心开发任务" },
    { color: "#6B5B95", label: "产品原型设计" },
    { color: "#88B04B", label: "数据处理" },
    { color: "#F7CAC9", label: "研究实验项目" },
    { color: "#92A8D1", label: "系统集成" },
    { color: "#955251", label: "分析优化" },
];


export const ProjectDetail: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const projectId = id ?? "";
    const {data: project, loading, error} = useProjectById(projectId);

    const {data: tasks, refetch: refetchTasks} = useTasks(projectId, Boolean(projectId));
    const {update: updateTask} = useUpdateTask();
    const {reorder: reorderTasks} = useReorderTasks();

    const parentTaskOptions = useMemo(
        () =>
            tasks.map((t) => ({
                value: t.id,
                label: t.taskName
            })),
        [tasks]
    );

    const [taskAttributeDrawerOpen, setTaskAttributeDrawerOpen] = useState(false);
    const [createTaskDrawerOpen, setCreateTaskDrawerOpen] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [resources, setResources] = useState<Resource[]>([]);
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);

    // 甘特图时间范围状态
    const [ganttStartDate, setGanttStartDate] = useState<dayjs.Dayjs | null>(null);
    const [ganttEndDate, setGanttEndDate] = useState<dayjs.Dayjs | null>(null);

    // 视图类型状态
    const [viewType, setViewType] = useState<ViewType>("Day");

    // 列配置状态
    const [visibleColumns, setVisibleColumns] = useState({
        title: true,
        order: false,
        parentId: false
    });


    // lineHeight 配置
    const [lineHeightMode, setLineHeightMode] = useState<'small' | 'medium' | 'large' | 'custom'>('medium');
    const [customLineHeight, setCustomLineHeight] = useState(40);

    // slotMinWidth 配置
    const [slotMinWidthMode, setSlotMinWidthMode] = useState<'small' | 'medium' | 'large' | 'custom'>('medium');
    const [customSlotMinWidth, setCustomSlotMinWidth] = useState(50);

    // 预设尺寸映射
    const lineHeightPresets = {
        small: 30,
        medium: 40,
        large: 50
    };

    const slotMinWidthPresets = {
        small: 40,
        medium: 50,
        large: 60
    };

    // 计算实际使用的值
    const actualLineHeight = lineHeightMode === 'custom' ? customLineHeight : lineHeightPresets[lineHeightMode];
    const actualSlotMinWidth = slotMinWidthMode === 'custom' ? customSlotMinWidth : slotMinWidthPresets[slotMinWidthMode];

    // 动态高度计算 - 使用 refs
    const cardHeaderRef = useRef<HTMLDivElement>(null);
    const legendRef = useRef<HTMLDivElement>(null);
    const projectInfoRef = useRef<HTMLDivElement>(null);

    // 使用自定义 Hook 计算动态高度
    const { height: schedulantHeight, containerRef } = useSchedulantHeight(cardHeaderRef, legendRef);

    // 当项目数据加载完成后，初始化甘特图时间范围
    useEffect(() => {
        if (!project) return;
        setGanttStartDate(dayjs(project.startDateTime));
        setGanttEndDate(project.endDateTime ? dayjs(project.endDateTime) : dayjs(project.startDateTime).add(3, "month"));
    }, [project]);

    // 当 tasks 加载/刷新时，用真实数据驱动甘特图
    useEffect(() => {
        const {resources, events, milestones, checkpoints} = tasksToSchedulantModels(tasks);
        setResources(resources);
        setEvents(events);
        setMilestones(milestones);
        setCheckpoints(checkpoints);
    }, [tasks]);

    const handleBack = () => {
        navigate("/home/project-management");
    };

    // 向前移动时间范围（向左）
    const handleShiftLeft = () => {
        if (!ganttStartDate || !ganttEndDate) return;
        const unit = viewUnitMap[viewType];
        const duration = ganttEndDate.diff(ganttStartDate, unit as any);
        setGanttStartDate(ganttStartDate.subtract(duration, unit as any));
        setGanttEndDate(ganttEndDate.subtract(duration, unit as any));
    };

    // 向后移动时间范围（向右）
    const handleShiftRight = () => {
        if (!ganttStartDate || !ganttEndDate) return;
        const unit = viewUnitMap[viewType];
        const duration = ganttEndDate.diff(ganttStartDate, unit as any);
        setGanttStartDate(ganttStartDate.add(duration, unit as any));
        setGanttEndDate(ganttEndDate.add(duration, unit as any));
    };

    const handleEventResize = (eventResizeMountArg: EventResizeMountArg, field: "start" | "end") => {
        const {date, eventApi} = eventResizeMountArg;
        const targetId = eventApi.getId();
        setEvents(events => {
            const index = events.findIndex(e => e.id === targetId);
            if (index === -1) return events;
            const newEvents = [...events];
            newEvents[index] = {...events[index], [field]: date};
            return newEvents;
        });

        // persist to backend (best-effort)
        void (async () => {
            try {
                await updateTask(projectId, targetId, {
                    [field === "start" ? "startDateTime" : "endDateTime"]: toNaiveDateTimeString(date)
                });
                await refetchTasks();
            } catch {
                // rollback by re-fetching canonical server state
                await refetchTasks();
            }
        })();
    };

    // 加载状态
    if (loading) {
        return (
            <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>
                <Spin size="large">
                    <div style={{padding: "50px"}} />
                </Spin>
            </div>
        );
    }

    // 错误状态
    if (error || !project) {
        return (
            <div style={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>
                <Result
                    status="404"
                    title="项目不存在"
                    subTitle="抱歉，您访问的项目不存在或已被删除。"
                    extra={
                        <Space>
                            <Button type="primary" onClick={handleBack}>
                                返回项目列表
                            </Button>
                            <Button onClick={() => setTaskAttributeDrawerOpen(true)}>
                                配置任务自定义字段
                            </Button>
                        </Space>
                    }
                />
            </div>
        );
    }

    const startDate = dayjs(project.startDateTime);
    const endDate = project.endDateTime ? dayjs(project.endDateTime) : startDate.add(3, "month");

    // 使用甘特图自定义时间范围，如果未设置则使用项目默认时间
    const displayStartDate = ganttStartDate || startDate;
    const displayEndDate = ganttEndDate || endDate;

    // 根据配置生成显示的列
    // Schedulant types this prop as ReactNode; we still pass its expected column objects.
    const resourceAreaColumns = (
        [
            visibleColumns.title && {
                field: "title",
                headerContent: "任务/团队"
            },
            visibleColumns.order && {
                field: "order",
                headerContent: "排序"
            },
            visibleColumns.parentId && {
                field: "parentId",
                headerContent: "父级ID"
            }
        ].filter((col): col is {field: string; headerContent: string} => Boolean(col))
    ) as unknown as ResourceAreaColumn[];


    return (
        <div ref={containerRef} className="project-detail">
            <Card
                className="gantt-chart-card"
                title={
                    <div ref={cardHeaderRef}>
                        <GanttToolbar
                            projectName={project.projectName}
                            viewType={viewType}
                            ganttStartDate={ganttStartDate}
                            ganttEndDate={ganttEndDate}
                            onViewTypeChange={setViewType}
                            onStartDateChange={setGanttStartDate}
                            onEndDateChange={setGanttEndDate}
                            onShiftLeft={handleShiftLeft}
                            onShiftRight={handleShiftRight}
                            onJumpToToday={() => {
                                const unit = viewUnitMap[viewType];
                                const range = viewDefaultRangeMap[viewType];
                                setGanttStartDate(dayjs());
                                setGanttEndDate(dayjs().add(range, unit as any));
                            }}
                            onOpenTaskAttributeConfig={() => setTaskAttributeDrawerOpen(true)}
                            onOpenCreateTask={() => setCreateTaskDrawerOpen(true)}
                            onBack={handleBack}
                            lineHeightMode={lineHeightMode}
                            customLineHeight={customLineHeight}
                            slotMinWidthMode={slotMinWidthMode}
                            customSlotMinWidth={customSlotMinWidth}
                            actualLineHeight={actualLineHeight}
                            actualSlotMinWidth={actualSlotMinWidth}
                            visibleColumns={visibleColumns}
                            onLineHeightModeChange={setLineHeightMode}
                            onCustomLineHeightChange={setCustomLineHeight}
                            onSlotMinWidthModeChange={setSlotMinWidthMode}
                            onCustomSlotMinWidthChange={setCustomSlotMinWidth}
                            onVisibleColumnsChange={setVisibleColumns}
                        />
                    </div>
                }>
                <div className="schedulant-container">
                    <div style={{position: "relative"}}>
                        <Schedulant
                            start={displayStartDate}
                            end={displayEndDate}
                            editable={true}
                            selectable={true}
                            lineHeight={actualLineHeight}
                            slotMinWidth={actualSlotMinWidth}
                            schedulantViewType={viewType}
                            schedulantMaxHeight={schedulantHeight}
                            resources={resources}
                            events={events}
                            checkpoints={checkpoints}
                            milestones={milestones}
                            dragHintColor="rgb(66, 133, 244, 0.08)"
                            selectionColor="rgba(66, 133, 244, 0.08)"
                            resourceAreaWidth={"20%"}
                            resourceAreaColumns={resourceAreaColumns}
                            milestoneMove={(milestoneMoveMountArg: MilestoneMoveMountArg) => {
                                const {date, milestoneApi} = milestoneMoveMountArg;
                                const targetId = milestoneApi.getId();
                                setMilestones(milestones => {
                                    const index = milestones.findIndex(m => m.id === targetId);
                                    if (index === -1) return milestones;
                                    const newMilestones = [...milestones];
                                    newMilestones[index] = {...milestones[index], time: date};
                                    return newMilestones;
                                });

                                void (async () => {
                                    try {
                                        // milestone uses startDateTime; keep end aligned too
                                        const dt = toNaiveDateTimeString(date);
                                        await updateTask(projectId, targetId, {
                                            startDateTime: dt,
                                            endDateTime: dt
                                        });
                                        await refetchTasks();
                                    } catch {
                                        await refetchTasks();
                                    }
                                })();
                            }}
                            checkpointMove={(checkpointMoveMountArg: CheckpointMoveMountArg) => {
                                const {date, checkpointApi} = checkpointMoveMountArg;
                                const targetId = checkpointApi.getId();
                                setCheckpoints(checkpoints => {
                                    const index = checkpoints.findIndex(c => c.id === targetId);
                                    if (index === -1) return checkpoints;
                                    const newCheckpoints = [...checkpoints];
                                    newCheckpoints[index] = {...checkpoints[index], time: date};
                                    return newCheckpoints;
                                });

                                void (async () => {
                                    try {
                                        const dt = toNaiveDateTimeString(date);
                                        await updateTask(projectId, targetId, {
                                            startDateTime: dt,
                                            endDateTime: dt
                                        });
                                        await refetchTasks();
                                    } catch {
                                        await refetchTasks();
                                    }
                                })();
                            }}
                            eventMove={(eventMoveMountArg: EventMoveMountArg) => {
                                const {startDate, endDate, eventApi} = eventMoveMountArg;
                                const targetId = eventApi.getId();
                                setEvents(events => {
                                    const index = events.findIndex(e => e.id === targetId);
                                    if (index === -1) return events;
                                    const newEvents = [...events];
                                    newEvents[index] = {...events[index], start: startDate, end: endDate};
                                    return newEvents;
                                });

                                void (async () => {
                                    try {
                                        await updateTask(projectId, targetId, {
                                            startDateTime: toNaiveDateTimeString(startDate),
                                            endDateTime: toNaiveDateTimeString(endDate)
                                        });
                                        await refetchTasks();
                                    } catch {
                                        await refetchTasks();
                                    }
                                })();
                            }}
                            eventResizeStart={(eventResizeMountArg: EventResizeMountArg) => handleEventResize(eventResizeMountArg, "start")}
                            eventResizeEnd={(eventResizeMountArg: EventResizeMountArg) => handleEventResize(eventResizeMountArg, "end")}
                            resourceLaneMove={(resourceLaneMoveArg: ResourceLaneMovePayload) => {
                                const {draggedResourceApi, targetResourceApi, position} = resourceLaneMoveArg;
                                const draggedId = draggedResourceApi.getId();
                                const targetId = targetResourceApi.getId();

                                // compute new parentId + a best-effort order (fractional order to allow inserts)
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
                                    // child: append to end of new parent's children
                                    const last = siblings[siblings.length - 1];
                                    newOrder = (last?.order ?? 0) + 1;
                                }

                                // optimistic UI update
                                setResources((resources) => {
                                    const newResources = [...resources];
                                    const draggedIndex = newResources.findIndex((r) => r.id === draggedId);
                                    if (draggedIndex === -1) return resources;

                                    newResources[draggedIndex] = {
                                        ...newResources[draggedIndex],
                                        parentId: newParentId ?? undefined,
                                        extendedProps: {
                                            ...(newResources[draggedIndex].extendedProps as any),
                                            order: newOrder ?? undefined
                                        }
                                    };

                                    return newResources;
                                });

                                void (async () => {
                                    try {
                                        await updateTask(projectId, draggedId, {
                                            parentId: newParentId,
                                            order: newOrder
                                        });

                                        // integer normalize: reorder both source siblings and destination siblings
                                        await reorderTasks(projectId, {parentId: oldParentId});
                                        if (newParentId !== oldParentId) {
                                            await reorderTasks(projectId, {parentId: newParentId});
                                        }

                                        await refetchTasks();
                                    } catch {
                                        await refetchTasks();
                                    }
                                })();
                            }}
                        />
                    </div>

                    {/* 图例 - 独立在 Schedulant 下方 */}
                    <GanttLegend ref={legendRef} items={legendItems} />

                    {/* 项目信息 */}
                    <ProjectInfo
                        ref={projectInfoRef}
                        startDateTime={project.startDateTime}
                        endDateTime={project.endDateTime}
                    />
                </div>
            </Card>

            <TaskAttributeConfigDrawer
                open={taskAttributeDrawerOpen}
                projectId={project.id}
                onClose={() => setTaskAttributeDrawerOpen(false)}
            />

            <CreateTaskDrawer
                open={createTaskDrawerOpen}
                projectId={project.id}
                parentOptions={parentTaskOptions}
                defaultRange={{
                    start: displayStartDate.startOf("day"),
                    end: displayStartDate.startOf("day").add(7, "day")
                }}
                onClose={() => setCreateTaskDrawerOpen(false)}
                onCreated={async () => {
                    await refetchTasks();
                }}
            />
        </div>
    );
};


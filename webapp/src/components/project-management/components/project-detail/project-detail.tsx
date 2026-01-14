import React, {useState, useEffect, useRef} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {Button, Card, Result, Spin, Space} from "antd";
import dayjs from "dayjs";
import {
    type Checkpoint,
    type Event,
    type EventResizeMountArg,
    type Milestone,
    type Resource,
    Schedulant
} from "schedulant";
import {useProjectById} from "@Webapp/api/modules/project";
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


// 生成模拟资源数据
const generateMockResources = (): Resource[] => {
    return [
        {
            id: "8968845952632643583",
            title: "AI Learning Platform",
            parentId: "4575511461886459807",
            extendedProps: {
                order: 1
            }
        },
        {
            id: "8858562325095899135",
            title: "Digital Twin Prototype",
            parentId: "8638818878966724025",
            extendedProps: {
                order: 1
            }
        },
        {
            id: "4577873557542726875",
            title: "Sensor Data Aggregator",
            parentId: "6769994271325942397",
            extendedProps: {
                order: 1
            }
        },
        {
            id: "6845329583583619071",
            title: "Quantum Computing Core",
            extendedProps: {
                order: 4
            }
        },
        {
            id: "8056891328444594143",
            title: "Ocean Mapping System",
            parentId: "8638818878966724025",
            extendedProps: {
                order: 2
            }
        },
        {
            id: "6769994271325942397",
            title: "Predictive Analytics",
            parentId: "8638818878966724025",
            extendedProps: {
                order: 3
            }
        },
        {
            id: "9061206907937352414",
            title: "Network Optimization Tool",
            parentId: "4575511461886459807",
            extendedProps: {
                order: 2
            }
        },
        {
            id: "4520338440843026263",
            title: "Cloud Service Manager",
            parentId: "6769994271325942397",
            extendedProps: {
                order: 2
            }
        },
        {
            id: "4611544951484800763",
            title: "Genomics Data Editor",
            parentId: "1441150215284248447",
            extendedProps: {
                order: 1
            }
        },
        {
            id: "8646207595906260967",
            title: "IoT Device Simulator",
            parentId: "6845329583583619071",
            extendedProps: {
                order: 3
            }
        },
        {
            id: "2155243416680034047",
            title: "AI Model Trainer",
            parentId: "7782148686900483486",
            extendedProps: {
                order: 1
            }
        },
        {
            id: "8638818878966724025",
            title: "Real-Time Data Processor",
            extendedProps: {
                order: 2
            }
        },
        {
            id: "3382749776007979989",
            title: "Cybersecurity Platform",
            parentId: "8638818878966724025",
            extendedProps: {
                order: 4
            }
        },
        {
            id: "1583538290775185917",
            title: "Augmented Reality Engine",
            parentId: "8638818878966724025",
            extendedProps: {
                order: 5
            }
        },
        {
            id: "9204513212332502410",
            title: "Blockchain Validator",
            parentId: "6845329583583619071",
            extendedProps: {
                order: 1
            }
        },
        {
            id: "2304010924003085308",
            title: "Autonomous Vehicle Software",
            parentId: "1583538290775185917",
            extendedProps: {
                order: 1
            }
        },
        {
            id: "9194801021046288383",
            title: "Smart Grid Control",
            parentId: "6769994271325942397",
            extendedProps: {
                order: 3
            }
        },
        {
            id: "7782148686900483486",
            title: "AI-Assisted Diagnosis",
            parentId: "8638818878966724025",
            extendedProps: {
                order: 6
            }
        },
        {
            id: "1441150215284248447",
            title: "Edge Computing Platform",
            parentId: "8638818878966724025",
            extendedProps: {
                order: 7
            }
        },
        {
            id: "4575511461886459807",
            title: "Supply Chain Management",
            extendedProps: {
                order: 1
            }
        },
        {
            id: "8023584809911544803",
            title: "Virtual Reality Studio",
            parentId: "6845329583583619071",
            extendedProps: {
                order: 2
            }
        },
        {
            id: "9173832440948347237",
            title: "AI Voice Assistant",
            parentId: "8056891328444594143",
            extendedProps: {
                order: 1
            }
        },
        {
            id: "2265117022552053554",
            title: "Remote Sensing Software",
            parentId: "1441150215284248447",
            extendedProps: {
                order: 2
            }
        },
        {
            id: "6340927533520682495",
            title: "Data Analytics Dashboard",
            parentId: "3382749776007979989",
            extendedProps: {
                order: 2
            }
        },
        {
            id: "8892353061358296541",
            title: "Energy Management System",
            parentId: "3382749776007979989",
            extendedProps: {
                order: 1
            }
        },
        {
            id: "3601612769371250673",
            title: "Cloud Resource Allocator",
            parentId: "4575511461886459807",
            extendedProps: {
                order: 3
            }
        }
    ];
};

// 生成模拟事件数据
const generateMockEvents = (): Event[] => {
    return [
        {
            id: "8968845952632643583",
            title: "AI Learning Platform",
            color: "#FF6F61",
            start: dayjs("2024-08-01"),
            end: dayjs("2024-08-15"),
            resourceId: "8968845952632643583"
        },
        {
            id: "8858562325095899135",
            title: "Digital Twin Prototype",
            color: "#6B5B95",
            start: dayjs("2024-08-02"),
            end: dayjs("2024-08-08"),
            resourceId: "8858562325095899135"
        },
        {
            id: "4577873557542726875",
            title: "Sensor Data Aggregator",
            color: "#88B04B",
            start: dayjs("2024-08-16"),
            end: dayjs("2024-08-25"),
            resourceId: "4577873557542726875"
        },
        {
            id: "6845329583583619071",
            title: "Quantum Computing Core",
            color: "#F7CAC9",
            start: dayjs("2024-08-10"),
            end: dayjs("2024-09-20"),
            resourceId: "6845329583583619071"
        },
        {
            id: "8056891328444594143",
            title: "Ocean Mapping System",
            color: "#92A8D1",
            start: dayjs("2024-08-20"),
            end: dayjs("2024-09-10"),
            resourceId: "8056891328444594143"
        },
        {
            id: "6769994271325942397",
            title: "Predictive Analytics",
            color: "#955251",
            start: dayjs("2024-08-01"),
            end: dayjs("2024-08-20"),
            resourceId: "6769994271325942397"
        },
        {
            id: "9061206907937352414",
            title: "Network Optimization Tool",
            color: "#B565A7",
            start: dayjs("2024-08-15"),
            end: dayjs("2024-08-25"),
            resourceId: "9061206907937352414"
        },
        {
            id: "4520338440843026263",
            title: "Cloud Service Manager",
            color: "#009B77",
            start: dayjs("2024-08-05"),
            end: dayjs("2024-08-15"),
            resourceId: "4520338440843026263"
        },
        {
            id: "4611544951484800763",
            title: "Genomics Data Editor",
            color: "#DD4124",
            start: dayjs("2024-08-03"),
            end: dayjs("2024-08-18"),
            resourceId: "4611544951484800763"
        },
        {
            id: "8646207595906260967",
            title: "IoT Device Simulator",
            color: "#45B8AC",
            start: dayjs("2024-08-14"),
            end: dayjs("2024-08-22"),
            resourceId: "8646207595906260967"
        },
        {
            id: "2155243416680034047",
            title: "AI Model Trainer",
            color: "#EFC050",
            start: dayjs("2024-08-01"),
            end: dayjs("2024-08-15"),
            resourceId: "2155243416680034047"
        },
        {
            id: "8638818878966724025",
            title: "Real-Time Data Processor",
            color: "rgba(0,0,0,0.57)",
            start: dayjs("2024-08-10"),
            end: dayjs("2024-09-30"),
            resourceId: "8638818878966724025",
        },
        {
            id: "3382749776007979989",
            title: "Cybersecurity Platform",
            color: "#5B5EA6",
            start: dayjs("2024-08-12"),
            end: dayjs("2024-09-05"),
            resourceId: "3382749776007979989"
        },
        {
            id: "1583538290775185917",
            title: "Augmented Reality Engine",
            color: "#9B2335",
            start: dayjs("2024-08-10"),
            end: dayjs("2024-08-30"),
            resourceId: "1583538290775185917"
        },
        {
            id: "9204513212332502410",
            title: "Blockchain Validator",
            color: "#BC243C",
            start: dayjs("2024-08-15"),
            end: dayjs("2024-08-22"),
            resourceId: "9204513212332502410"
        },
        {
            id: "2304010924003085308",
            title: "Autonomous Vehicle Software",
            color: "#C3447A",
            start: dayjs("2024-08-15"),
            end: dayjs("2024-08-20"),
            resourceId: "2304010924003085308"
        },
        {
            id: "7782148686900483486",
            title: "AI-Assisted Diagnosis",
            color: "#98B4D4",
            start: dayjs("2024-08-01"),
            end: dayjs("2024-08-31"),
            resourceId: "7782148686900483486"
        },
        {
            id: "1441150215284248447",
            title: "Edge Computing Platform",
            color: "#FF6F61",
            start: dayjs("2024-08-05"),
            end: dayjs("2024-08-12"),
            resourceId: "1441150215284248447"
        },
        {
            id: "4575511461886459807",
            title: "Supply Chain Management",
            color: "#6B5B95",
            start: dayjs("2024-08-10"),
            end: dayjs("2024-08-18"),
            resourceId: "4575511461886459807"
        },
        {
            id: "8023584809911544803",
            url: "https://fullcalendar.io/",
            title: "Virtual Reality Studio",
            color: "#88B04B",
            start: dayjs("2024-08-15"),
            end: dayjs("2024-08-20"),
            textColor: "red",
            resourceId: "8023584809911544803"
        },
        {
            id: "9173832440948347237",
            title: "AI Voice Assistant",
            color: "#F7CAC9",
            start: dayjs("2024-08-25"),
            end: dayjs("2024-09-05"),
            resourceId: "9173832440948347237"
        },
        {
            id: "2265117022552053554",
            title: "Remote Sensing Software",
            color: "#92A8D1",
            start: dayjs("2024-08-02"),
            end: dayjs("2024-08-10"),
            resourceId: "2265117022552053554"
        },
        {
            id: "6340927533520682495",
            title: "Data Analytics Dashboard",
            color: "#955251",
            start: dayjs("2024-08-10"),
            end: dayjs("2024-08-20"),
            resourceId: "6340927533520682495"
        },
        {
            id: "8892353061358296541",
            title: "Energy Management System",
            color: "#B565A7",
            start: dayjs("2024-08-01"),
            end: dayjs("2024-08-15"),
            resourceId: "8892353061358296541"
        },
        {
            id: "3601612769371250673",
            title: "Cloud Resource Allocator",
            color: "#009B77",
            start: dayjs("2024-09-01"),
            end: dayjs("2024-09-20"),
            resourceId: "3601612769371250673"
        }
    ];
};

// 生成模拟里程碑
const generateMockMilestones = (): Milestone[] => {
    return [
        {
            id: "1",
            title: "milestone1",
            time: dayjs("2024-08-31"),
            status: "Success",
            resourceId: "8638818878966724025",
        }
    ];
};

// 生成模拟检查点
const generateMockCheckpoints = (): Checkpoint[] => {
    return [
        {
            id: "1",
            title: "Test Condition Monitor",
            color: "green",
            time: dayjs("2024-09-05"),
            resourceId: "8056891328444594143",
        },
    ];
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
    const {data: project, loading, error} = useProjectById(id!);

    const [taskAttributeDrawerOpen, setTaskAttributeDrawerOpen] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [resources, setResources] = useState<Resource[]>(() => generateMockResources());
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

    // 当项目数据加载完成后，初始化事件、里程碑和检查点
    useEffect(() => {
        if (project) {
            setEvents(generateMockEvents());
            setMilestones(generateMockMilestones());
            setCheckpoints(generateMockCheckpoints());

            // 初始化甘特图时间范围
            setGanttStartDate(dayjs(project.startDateTime));
            setGanttEndDate(project.endDateTime ? dayjs(project.endDateTime) : dayjs(project.startDateTime).add(3, "month"));
        }
    }, [project]);


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
    const resourceAreaColumns = [
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
    ].filter((col): col is { field: string; headerContent: string } => Boolean(col));


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
                            milestoneMove={(milestoneMoveMountArg) => {
                                const {date, milestoneApi} = milestoneMoveMountArg;
                                const targetId = milestoneApi.getId();
                                setMilestones(milestones => {
                                    const index = milestones.findIndex(m => m.id === targetId);
                                    if (index === -1) return milestones;
                                    const newMilestones = [...milestones];
                                    newMilestones[index] = {...milestones[index], time: date};
                                    return newMilestones;
                                });
                            }}
                            checkpointMove={(checkpointMoveMountArg) => {
                                const {date, checkpointApi} = checkpointMoveMountArg;
                                const targetId = checkpointApi.getId();
                                setCheckpoints(checkpoints => {
                                    const index = checkpoints.findIndex(c => c.id === targetId);
                                    if (index === -1) return checkpoints;
                                    const newCheckpoints = [...checkpoints];
                                    newCheckpoints[index] = {...checkpoints[index], time: date};
                                    return newCheckpoints;
                                });
                            }}
                            eventMove={(eventMoveMountArg) => {
                                const {startDate, endDate, eventApi} = eventMoveMountArg;
                                const targetId = eventApi.getId();
                                setEvents(events => {
                                    const index = events.findIndex(e => e.id === targetId);
                                    if (index === -1) return events;
                                    const newEvents = [...events];
                                    newEvents[index] = {...events[index], start: startDate, end: endDate};
                                    return newEvents;
                                });
                            }}
                            eventResizeStart={(eventResizeMountArg) => handleEventResize(eventResizeMountArg, "start")}
                            eventResizeEnd={(eventResizeMountArg) => handleEventResize(eventResizeMountArg, "end")}
                            resourceLaneMove={(resourceLaneMoveArg) => {
                                const {draggedResourceApi, targetResourceApi, position} = resourceLaneMoveArg;
                                const draggedId = draggedResourceApi.getId();
                                const targetId = targetResourceApi.getId();

                                setResources(resources => {
                                    const newResources = [...resources];
                                    const draggedIndex = newResources.findIndex(r => r.id === draggedId);
                                    if (draggedIndex === -1) return resources;

                                    const draggedResource = {...newResources[draggedIndex]};
                                    const targetResource = newResources.find(r => r.id === targetId);

                                    if (position === "child") {
                                        draggedResource.parentId = targetId;
                                    } else {
                                        draggedResource.parentId = targetResource?.parentId;
                                    }

                                    newResources[draggedIndex] = draggedResource;
                                    return newResources;
                                });
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
        </div>
    );
};


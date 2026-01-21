import React, {useMemo} from "react";
import {Button, Drawer, Divider, Descriptions, Space, Spin, Tag, Typography} from "antd";
import dayjs from "dayjs";
import {
    ProjectTaskAttributeTypeLabels,
    type JsonValue,
    type ProjectTask,
    type ProjectTaskAttributeConfig,
    ProjectTaskType,
    TaskTypeLabels
} from "@Webapp/api/modules/project";
import {
    buildSelectValueLabelMap,
    buildUserValueLabelMap,
    toScalarString,
    toUserIdFromJson
} from "@Webapp/pages/home-page/components/project-management/components/project-detail/utils.ts";

const {Text} = Typography;

export interface TaskPreviewDrawerProps {
    open: boolean;
    task: ProjectTask | null;
    attributeConfigs: readonly ProjectTaskAttributeConfig[];
    attributeConfigsLoading?: boolean;
    parentLabelMap?: ReadonlyMap<string, string>;
    onEdit?: () => void;
    onClose: () => void;
}

const EMPTY_DISPLAY = "-";

const formatDateTime = (raw: string | null | undefined) => {
    if (!raw) return EMPTY_DISPLAY;
    const d = dayjs(raw);
    return d.isValid() ? d.format("YYYY-MM-DD HH:mm") : raw;
};

const formatCustomValue = (
    raw: JsonValue | undefined,
    cfg: ProjectTaskAttributeConfig,
    selectLabelMap: ReadonlyMap<string, string> | undefined,
    userLabelMap: ReadonlyMap<string, string> | undefined
): string => {
    if (raw == null) return EMPTY_DISPLAY;

    if (cfg.attributeType === "select") {
        const key = toScalarString(raw);
        if (!key) return EMPTY_DISPLAY;
        return selectLabelMap?.get(key) ?? key;
    }

    if (cfg.attributeType === "user") {
        const userId = toUserIdFromJson(raw);
        if (!userId) return EMPTY_DISPLAY;
        return userLabelMap?.get(userId) ?? userId;
    }

    if (cfg.attributeType === "date") {
        const s = toScalarString(raw);
        if (!s) return EMPTY_DISPLAY;
        const d = dayjs(s);
        return d.isValid() ? d.format("YYYY-MM-DD") : s;
    }

    if (cfg.attributeType === "datetime") {
        const s = toScalarString(raw);
        if (!s) return EMPTY_DISPLAY;
        const d = dayjs(s);
        return d.isValid() ? d.format("YYYY-MM-DD HH:mm") : s;
    }

    const s = toScalarString(raw);
    return s ?? EMPTY_DISPLAY;
};

export const TaskPreviewDrawer: React.FC<TaskPreviewDrawerProps> = ({
    open,
    task,
    attributeConfigs,
    attributeConfigsLoading,
    parentLabelMap,
    onEdit,
    onClose
}) => {
    const taskTypeLabel = task
        ? TaskTypeLabels[(task.taskType as ProjectTaskType) ?? ProjectTaskType.UNKNOWN] ?? String(task.taskType)
        : EMPTY_DISPLAY;

    const parentDisplay = useMemo(() => {
        if (!task?.parentId) return EMPTY_DISPLAY;
        const label = parentLabelMap?.get(task.parentId);
        return label ?? EMPTY_DISPLAY;
    }, [parentLabelMap, task]);

    const customAttributes = useMemo(() => {
        const raw = task?.customAttributes;
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {} as Record<string, JsonValue>;
        return raw as Record<string, JsonValue>;
    }, [task?.customAttributes]);

    const configsSorted = useMemo(() => {
        return attributeConfigs
            .slice()
            .filter((c) => Boolean(c.attributeName))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }, [attributeConfigs]);

    const selectLabelMaps = useMemo(() => {
        const m = new Map<string, ReadonlyMap<string, string>>();
        for (const cfg of configsSorted) {
            if (!cfg.attributeName) continue;
            if (cfg.attributeType !== "select") continue;
            m.set(cfg.attributeName, buildSelectValueLabelMap(cfg.options));
        }
        return m;
    }, [configsSorted]);

    const userLabelMaps = useMemo(() => {
        const m = new Map<string, ReadonlyMap<string, string>>();
        for (const cfg of configsSorted) {
            if (!cfg.attributeName) continue;
            if (cfg.attributeType !== "user") continue;
            m.set(cfg.attributeName, buildUserValueLabelMap(cfg.options));
        }
        return m;
    }, [configsSorted]);

    const unknownKeys = useMemo(() => {
        const allowed = new Set(configsSorted.map((c) => c.attributeName));
        return Object.keys(customAttributes).filter((k) => !allowed.has(k)).sort((a, b) => a.localeCompare(b));
    }, [configsSorted, customAttributes]);

    return (
        <Drawer
            title="任务预览"
            open={open}
            size={"large"}
            onClose={onClose}
            footer={
                <div style={{display: "flex", justifyContent: "space-between"}}>
                    <Text type="secondary">只读预览</Text>
                    <Space>
                        <Button
                            type="primary"
                            disabled={!task}
                            onClick={() => {
                                if (!task) return;
                                onClose();
                                onEdit?.();
                            }}
                        >
                            编辑任务
                        </Button>
                    </Space>
                </div>
            }
        >
            {!task ? (
                <Text type="secondary">未选择任务</Text>
            ) : (
                <>
                    <Descriptions
                        bordered
                        size="small"
                        column={1}
                        labelStyle={{width: 120}}
                    >
                        <Descriptions.Item label="任务名称">{task.taskName || EMPTY_DISPLAY}</Descriptions.Item>
                        <Descriptions.Item label="任务类型">
                            <Tag>{taskTypeLabel}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="父任务">{parentDisplay}</Descriptions.Item>
                        <Descriptions.Item label="开始时间">{formatDateTime(task.startDateTime)}</Descriptions.Item>
                        <Descriptions.Item label="结束时间">{formatDateTime(task.endDateTime)}</Descriptions.Item>
                        <Descriptions.Item label="排序">
                            {task.order == null ? EMPTY_DISPLAY : String(task.order)}
                        </Descriptions.Item>
                    </Descriptions>

                    <Divider style={{marginTop: 16, marginBottom: 12}}/>

                    <div style={{marginBottom: 8}}>
                        <Text strong>自定义属性</Text>
                        {attributeConfigsLoading ? (
                            <span style={{marginLeft: 8}}><Text type="secondary">加载中…</Text></span>
                        ) : null}
                    </div>

                    <Spin spinning={Boolean(attributeConfigsLoading)}>
                        {configsSorted.length ? (
                            <Descriptions bordered size="small" column={1} labelStyle={{width: 180}}>
                                {configsSorted.map((cfg) => {
                                    const name = cfg.attributeName;
                                    if (!name) return null;

                                    const label = (
                                        <Space size={6}>
                                            <span>{cfg.attributeLabel || name}</span>
                                            <Text type="secondary" style={{fontSize: 12}}>
                                                ({
                                                    ProjectTaskAttributeTypeLabels[
                                                        (cfg.attributeType as keyof typeof ProjectTaskAttributeTypeLabels) ?? "text"
                                                    ] ?? cfg.attributeType
                                                })
                                            </Text>
                                        </Space>
                                    );

                                    const v = customAttributes[name];
                                    const valueText = formatCustomValue(
                                        v,
                                        cfg,
                                        selectLabelMaps.get(name),
                                        userLabelMaps.get(name)
                                    );

                                    return (
                                        <Descriptions.Item key={cfg.id} label={label}>
                                            {valueText}
                                        </Descriptions.Item>
                                    );
                                })}
                            </Descriptions>
                        ) : (
                            <Text type="secondary">当前项目没有配置自定义属性</Text>
                        )}

                        {unknownKeys.length ? (
                            <>
                                <Divider style={{marginTop: 16, marginBottom: 12}}/>
                                <Text strong>未知字段（已删除或未配置）</Text>
                                <Descriptions
                                    bordered
                                    size="small"
                                    column={1}
                                    labelStyle={{width: 180}}
                                    style={{marginTop: 8}}
                                >
                                    {unknownKeys.map((k) => (
                                        <Descriptions.Item key={k} label={k}>
                                            {toScalarString(customAttributes[k]) ?? EMPTY_DISPLAY}
                                        </Descriptions.Item>
                                    ))}
                                </Descriptions>
                            </>
                        ) : null}
                    </Spin>
                </>
            )}
        </Drawer>
    );
};

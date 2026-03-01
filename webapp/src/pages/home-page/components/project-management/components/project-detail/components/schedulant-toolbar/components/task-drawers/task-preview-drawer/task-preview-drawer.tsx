import React, {useMemo} from "react";
import {Button, Descriptions, Divider, Space, Spin, Tag, Typography} from "antd";
import {ResizableDrawer} from "@Webapp/components";
import dayjs from "dayjs";
import {useTranslation} from "react-i18next";
import {
    type JsonValue,
    type ProjectTask,
    type ProjectTaskAttributeConfig,
    ProjectTaskAttributeTypeLabelKeys,
    ProjectTaskType,
    TaskTypeLabelKeys
} from "@Webapp/api/modules/project";
import {buildSelectValueLabelMap, buildUserValueLabelMap, toScalarString, toUserIdFromJson} from "../index.ts";

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
    const {t} = useTranslation();

    const taskTypeLabel = task
        ? t(TaskTypeLabelKeys[(task.taskType as ProjectTaskType) ?? ProjectTaskType.UNKNOWN] ?? String(task.taskType))
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

    const footer = useMemo(() => (
        <div className="drawer-footer" style={{display: "flex", justifyContent: "space-between"}}>
            <Text type="secondary">{t("task.readonlyPreview")}</Text>
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
                    {t("common.edit")}
                </Button>
            </Space>
        </div>
    ), [task, onClose, onEdit, t]);

    return (
        <ResizableDrawer
            title={t("common.preview")}
            open={open}
            defaultSize={736}
            onClose={onClose}
            footer={footer}
        >
            {!task ? (
                <Text type="secondary">{t("task.noTask")}</Text>
            ) : (
                <>
                    <Descriptions
                        bordered
                        size="small"
                        column={1}
                        labelStyle={{width: 120}}
                    >
                        <Descriptions.Item label={t("task.taskName")}>{task.taskName || EMPTY_DISPLAY}</Descriptions.Item>
                        <Descriptions.Item label={t("task.taskType")}>
                            <Tag>{taskTypeLabel}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t("task.parentTask")}>{parentDisplay}</Descriptions.Item>
                        <Descriptions.Item label={t("task.startTime")}>{formatDateTime(task.startDateTime)}</Descriptions.Item>
                        <Descriptions.Item label={t("task.endTime")}>{formatDateTime(task.endDateTime)}</Descriptions.Item>
                        <Descriptions.Item label={t("task.order")}>
                            {task.order == null ? EMPTY_DISPLAY : String(task.order)}
                        </Descriptions.Item>
                    </Descriptions>

                    <Divider style={{marginTop: 16, marginBottom: 12}}/>

                    <div style={{marginBottom: 8}}>
                        <Text strong>{t("task.customAttributes")}</Text>
                        {attributeConfigsLoading ? (
                            <span style={{marginLeft: 8}}>
                                <Text type="secondary">{t("common.loading")}</Text>
                            </span>
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
                                                ({t(
                                                    ProjectTaskAttributeTypeLabelKeys[
                                                        (cfg.attributeType as keyof typeof ProjectTaskAttributeTypeLabelKeys) ?? "text"
                                                    ] ?? cfg.attributeType
                                                )})
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
                            <Text type="secondary">{t("task.noCustomAttributes")}</Text>
                        )}

                        {unknownKeys.length ? (
                            <>
                                <Divider style={{marginTop: 16, marginBottom: 12}}/>
                                <Text strong>{t("task.unknownFields")}</Text>
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
        </ResizableDrawer>
    );
};

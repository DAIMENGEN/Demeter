import React, {useCallback, useEffect, useMemo} from "react";
import {Button, Form, Space, Typography} from "antd";
import {ResizableDrawer} from "@Webapp/components";
import dayjs, {type Dayjs} from "dayjs";
import {useTranslation} from "react-i18next";
import {
    type CreateProjectTaskParams,
    ProjectTaskType,
    useProjectTaskActions,
    useProjectTaskAttributeConfigList
} from "@Webapp/api/modules/project";
import {
    buildAttributeTypeMap,
    buildDefaultCustomAttrsFromConfigs,
    normalizeCustomAttributesToStrings,
    renderCustomAttributeItems,
    toNaiveDateTimeString,
    type TaskDrawerFormValues
} from "../index.ts";
import {FormFields} from "../form-fields.tsx";
import "./create-task-drawer.scss";

const {Text} = Typography;

const CREATE_TITLE_MAP: Record<number, string> = {
    [ProjectTaskType.DEFAULT]: "task.createTask",
    [ProjectTaskType.MILESTONE]: "task.createMilestone",
    [ProjectTaskType.CHECKPOINT]: "task.createCheckpoint",
};

export interface CreateTaskDrawerProps {
    open: boolean;
    projectId: string;
    parentOptions: Array<{ value: string; label: string }>;
    defaultParentId?: string;
    defaultOrder?: number;
    defaultRange?: {
        start: Dayjs;
        end: Dayjs;
    };
    defaultTaskType?: number;
    onSuccess?: () => void;
    onClose: () => void;
}

export const CreateTaskDrawer: React.FC<CreateTaskDrawerProps> = ({
    open,
    projectId,
    parentOptions,
    defaultParentId,
    defaultOrder = 1.0,
    defaultRange,
    defaultTaskType = ProjectTaskType.DEFAULT,
    onSuccess,
    onClose
}) => {
    const [form] = Form.useForm<TaskDrawerFormValues>();
    const {t} = useTranslation();
    const {createTask, loading} = useProjectTaskActions();
    const {configs: attributeConfigs, loading: attributeConfigsLoading, fetchConfigs} = useProjectTaskAttributeConfigList();

    const attributeTypeMap = useMemo(() => buildAttributeTypeMap(attributeConfigs), [attributeConfigs]);

    // Fetch attribute configs when drawer opens
    useEffect(() => {
        if (open && projectId) {
            fetchConfigs(projectId);
        }
    }, [open, projectId, fetchConfigs]);

    // Initialize form values when opening
    useEffect(() => {
        if (open) {
            const start = defaultRange?.start ?? dayjs();
            let end = defaultRange?.end ?? start.add(7, "day");

            const isSingleDateType = defaultTaskType === ProjectTaskType.CHECKPOINT || defaultTaskType === ProjectTaskType.MILESTONE;
            if (isSingleDateType) {
                end = start;
            }

            const defaults = buildDefaultCustomAttrsFromConfigs(attributeConfigs);

            form.setFieldsValue({
                taskType: defaultTaskType,
                parentId: defaultParentId,
                order: defaultOrder,
                dateRange: [start, end],
                customAttributes: defaults
            } satisfies Partial<TaskDrawerFormValues>);
        }
    }, [open, form, defaultRange, attributeConfigs, defaultParentId, defaultOrder, defaultTaskType]);

    const handleSubmit = useCallback(async () => {
        try {
            const values = await form.validateFields();

            const [startDateTime, endDateTime] = values.dateRange ?? [];
            if (!startDateTime || !endDateTime) return;

            const customAttributes = normalizeCustomAttributesToStrings(values.customAttributes, attributeTypeMap);

            const payload: CreateProjectTaskParams = {
                taskName: values.taskName,
                parentId: values.parentId ?? null,
                order: values.order,
                startDateTime: toNaiveDateTimeString(startDateTime),
                endDateTime: toNaiveDateTimeString(endDateTime),
                taskType: values.taskType,
                customAttributes
            };

            await createTask(projectId, payload);
            form.resetFields();
            onClose();
            onSuccess?.();
        } catch (error) {
            console.error("Create task failed:", error);
        }
    }, [form, createTask, projectId, attributeTypeMap, onClose, onSuccess]);

    const handleCancel = useCallback(() => {
        form.resetFields();
        onClose();
    }, [form, onClose]);

    const customAttrItems = useMemo(() => {
        return renderCustomAttributeItems(attributeConfigs, t);
    }, [attributeConfigs, t]);

    const footer = useMemo(() => (
        <div className="drawer-footer">
            <Space>
                <Button onClick={handleCancel} disabled={loading}>{t("common.cancel")}</Button>
                <Button type="primary" onClick={handleSubmit} loading={loading}>
                    {t("common.submit")}
                </Button>
            </Space>
        </div>
    ), [handleCancel, handleSubmit, loading, t]);

    const drawerTitle = useMemo(() => {
        return t(CREATE_TITLE_MAP[defaultTaskType] ?? "task.createTask");
    }, [defaultTaskType, t]);

    return (
        <ResizableDrawer
            title={drawerTitle}
            onClose={handleCancel}
            open={open}
            forceRender
            classNames={{
                body: "create-task-drawer-body"
            }}
            footer={footer}
        >
            <Form layout="vertical" form={form} disabled={loading}>
                <FormFields
                    parentOptions={parentOptions}
                    hideTaskType={true}
                />

                <div style={{marginTop: 8, marginBottom: 8}}>
                    <Text strong>{t("task.customAttributes")}</Text>
                    {attributeConfigsLoading ? (
                        <div style={{marginTop: 8}}>
                            <Text type="secondary">{t("common.loading")}</Text>
                        </div>
                    ) : null}
                </div>

                {customAttrItems.length ? customAttrItems : (
                    <Text type="secondary">{t("task.noCustomAttributes")}</Text>
                )}
            </Form>
        </ResizableDrawer>
    );
};

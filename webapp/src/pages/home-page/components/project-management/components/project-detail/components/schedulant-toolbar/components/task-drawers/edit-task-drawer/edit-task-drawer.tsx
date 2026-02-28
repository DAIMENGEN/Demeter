import React, {useCallback, useEffect, useMemo} from "react";
import {Button, Form, Space, Typography} from "antd";
import {ResizableDrawer} from "@Webapp/components";
import dayjs from "dayjs";
import {useTranslation} from "react-i18next";
import {
    type JsonValue,
    type ProjectTask,
    useProjectTaskActions,
    useProjectTaskAttributeConfigList
} from "@Webapp/api/modules/project";
import {
    buildAttributeTypeMap,
    mapServerCustomAttrsToForm,
    normalizeCustomAttributesToStrings,
    renderCustomAttributeItems,
    toNaiveDateTimeString,
    type TaskDrawerFormValues
} from "../index.ts";
import {FormFields} from "../form-fields.tsx";
import "./edit-task-drawer.scss";

const {Text} = Typography;

export interface EditTaskDrawerProps {
    open: boolean;
    projectId: string;
    task: ProjectTask | null;
    parentOptions: Array<{ value: string; label: string }>;
    onSuccess?: () => void;
    onClose: () => void;
}

export const EditTaskDrawer: React.FC<EditTaskDrawerProps> = ({
    open,
    projectId,
    task,
    parentOptions,
    onSuccess,
    onClose
}) => {
    const [form] = Form.useForm<TaskDrawerFormValues>();
    const {t} = useTranslation();
    const {updateTask, loading} = useProjectTaskActions();
    const {configs: attributeConfigs, loading: attributeConfigsLoading, fetchConfigs} = useProjectTaskAttributeConfigList();

    const attributeTypeMap = useMemo(() => buildAttributeTypeMap(attributeConfigs), [attributeConfigs]);

    // Fetch attribute configs when drawer opens
    useEffect(() => {
        if (open && projectId) {
            fetchConfigs(projectId);
        }
    }, [open, projectId, fetchConfigs]);

    // Prefill form when opening; reset on close
    useEffect(() => {
        if (open && task) {
            const rawCustom = (task.customAttributes ?? {}) as Record<string, JsonValue>;
            const formCustom = mapServerCustomAttrsToForm(rawCustom, attributeTypeMap);

            const start = dayjs(task.startDateTime);
            const end = dayjs(task.endDateTime);

            form.setFieldsValue({
                taskName: task.taskName,
                parentId: task.parentId ?? undefined,
                order: task.order,
                dateRange: [start, end],
                taskType: task.taskType,
                customAttributes: formCustom
            } satisfies Partial<TaskDrawerFormValues>);
        } else if (!open) {
            form.resetFields();
        }
    }, [open, task, form, attributeTypeMap]);

    const handleSubmit = useCallback(async () => {
        if (!task) return;

        try {
            const values = await form.validateFields();

            const [startDateTime, endDateTime] = values.dateRange ?? [];
            if (!startDateTime || !endDateTime) return;

            const customAttributes = normalizeCustomAttributesToStrings(values.customAttributes, attributeTypeMap);

            await updateTask(projectId, task.id, {
                taskName: values.taskName,
                parentId: values.parentId ?? null,
                order: values.order ?? null,
                startDateTime: toNaiveDateTimeString(startDateTime),
                endDateTime: toNaiveDateTimeString(endDateTime),
                taskType: values.taskType,
                customAttributes
            });

            onClose();
            onSuccess?.();
        } catch (error) {
            console.error("Update task failed:", error);
        }
    }, [task, form, updateTask, projectId, attributeTypeMap, onClose, onSuccess]);

    const handleCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    const customAttrItems = useMemo(() => {
        return renderCustomAttributeItems(attributeConfigs, t);
    }, [attributeConfigs, t]);

    const footer = useMemo(() => (
        <div className="drawer-footer">
            <Space>
                <Button onClick={handleCancel} disabled={loading}>{t("common.cancel")}</Button>
                <Button type="primary" onClick={handleSubmit} loading={loading}>
                    {t("common.save")}
                </Button>
            </Space>
        </div>
    ), [handleCancel, handleSubmit, loading, t]);

    return (
        <ResizableDrawer
            title={t("common.edit")}
            onClose={handleCancel}
            open={open}
            forceRender
            loading={loading}
            classNames={{
                body: "edit-task-drawer-body"
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

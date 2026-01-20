import React, {useEffect, useMemo} from "react";
import {App, Button, Drawer, Form, Space, Spin, Typography} from "antd";
import dayjs from "dayjs";
import {
    type JsonValue,
    type Task,
    useTaskAttributeConfigs,
    useUpdateTask
} from "@Webapp/api/modules/project";
import {
    buildAttributeTypeMap,
    mapServerCustomAttrsToForm,
    normalizeCustomAttributesToStrings,
    renderCustomAttributeItems,
    type TaskDrawerFormValues
} from "../index.ts";
import {TaskDrawerFormFields} from "../task-drawer-form-fields";

const {Text} = Typography;

export interface EditTaskDrawerProps {
    open: boolean;
    projectId: string;
    /** current task to edit; must include full fields for prefill */
    task: Task | null;
    /** for parent selection */
    parentOptions: Array<{ value: string; label: string }>;
    onUpdated?: () => void;
    onClose: () => void;
}

export const EditTaskDrawer: React.FC<EditTaskDrawerProps> = ({
    open,
    projectId,
    task,
    parentOptions,
    onUpdated,
    onClose
}) => {
    const {message} = App.useApp();
    const [form] = Form.useForm<TaskDrawerFormValues>();
    const {update, loading} = useUpdateTask();

    const {data: attributeConfigs, loading: attributeConfigsLoading} = useTaskAttributeConfigs(projectId, open);

    const attributeTypeMap = useMemo(() => buildAttributeTypeMap(attributeConfigs), [attributeConfigs]);


    useEffect(() => {
        if (!open) {
            form.resetFields();
            return;
        }
        if (!task) {
            form.resetFields();
            return;
        }

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
    }, [open, task, form, attributeTypeMap]);

    const submit = async () => {
        if (!task) return;

        try {
            const values = await form.validateFields();

            const [startDateTime, endDateTime] = values.dateRange ?? [];
            if (!startDateTime || !endDateTime) return;

            const customAttributes = normalizeCustomAttributesToStrings(values.customAttributes, attributeTypeMap);

            await update(projectId, task.id, {
                taskName: values.taskName,
                parentId: values.parentId ?? null,
                order: values.order ?? null,
                startDateTime: startDateTime.format("YYYY-MM-DDTHH:mm:ss"),
                endDateTime: endDateTime.format("YYYY-MM-DDTHH:mm:ss"),
                taskType: values.taskType,
                customAttributes
            });

            message.success("更新成功");
            onClose();
            onUpdated?.();
        } catch (e: unknown) {
            const err = e as { message?: string };
            if (!err?.message) return;
            message.error(err.message || "更新失败");
        }
    };

    const customAttrItems = useMemo(() => {
        return renderCustomAttributeItems(attributeConfigs);
    }, [attributeConfigs]);

    return (
        <Drawer
            title="编辑任务"
            open={open}
            size={"large"}
            onClose={() => {
                if (loading) return;
                onClose();
            }}
            forceRender
            footer={
                <div style={{display: "flex", justifyContent: "flex-end"}}>
                    <Space>
                        <Button onClick={onClose} disabled={loading}>
                            取消
                        </Button>
                        <Button type="primary" loading={loading} disabled={loading} onClick={submit}>
                            保存
                        </Button>
                    </Space>
                </div>
            }
        >
            <Spin spinning={loading} tip="正在保存...">
                <Form layout="vertical" form={form} disabled={loading}>
                    <TaskDrawerFormFields
                        parentOptions={parentOptions}
                        hideTaskType={true}
                    />

                    <div style={{marginTop: 8, marginBottom: 8}}>
                        <Text strong>自定义属性</Text>
                        {attributeConfigsLoading ? (
                            <div style={{marginTop: 8}}><Text type="secondary">加载中…</Text></div>
                        ) : null}
                    </div>

                    {customAttrItems.length ? customAttrItems : (
                        <Text type="secondary">当前项目没有配置自定义属性</Text>
                    )}
                </Form>
            </Spin>
        </Drawer>
    );
};

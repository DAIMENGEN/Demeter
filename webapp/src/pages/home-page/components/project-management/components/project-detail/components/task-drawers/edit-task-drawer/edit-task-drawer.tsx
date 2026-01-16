import React, {useEffect, useMemo} from "react";
import {App, Button, DatePicker, Drawer, Form, Input, InputNumber, Select, Space, Spin, Typography} from "antd";
import dayjs from "dayjs";
import {
    type JsonValue,
    type Task,
    useTaskAttributeConfigs,
    useUpdateTask
} from "@Webapp/api/modules/project";
import {
    buildAttributeTypeMap,
    buildTaskTypeOptions,
    mapServerCustomAttrsToForm,
    normalizeCustomAttributesToStrings,
    renderCustomAttributeItems,
    type TaskDrawerFormValues
} from "../index.ts";

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

    const taskTypeOptions = useMemo(() => buildTaskTypeOptions(), []);

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

        form.setFieldsValue({
            taskName: task.taskName,
            parentId: task.parentId ?? undefined,
            order: task.order ?? undefined,
            startDateTime: dayjs(task.startDateTime),
            endDateTime: dayjs(task.endDateTime),
            taskType: task.taskType,
            customAttributes: formCustom
        });
    }, [open, task, form, attributeTypeMap]);

    const submit = async () => {
        if (!task) return;

        try {
            const values = await form.validateFields();
            if (values.endDateTime.isBefore(values.startDateTime)) {
                message.error("结束时间不能早于开始时间");
                return;
            }

            const customAttributes = normalizeCustomAttributesToStrings(values.customAttributes, attributeTypeMap);

            await update(projectId, task.id, {
                taskName: values.taskName,
                parentId: values.parentId ?? null,
                order: values.order ?? null,
                startDateTime: values.startDateTime.format("YYYY-MM-DDTHH:mm:ss"),
                endDateTime: values.endDateTime.format("YYYY-MM-DDTHH:mm:ss"),
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
                    <Form.Item
                        label="任务名称"
                        name="taskName"
                        rules={[{required: true, message: "请输入任务名称"}]}
                    >
                        <Input placeholder="请输入任务名称" allowClear/>
                    </Form.Item>

                    <Form.Item label="父任务" name="parentId">
                        <Select
                            placeholder="可选"
                            allowClear
                            options={parentOptions}
                            showSearch={{
                                optionFilterProp: "label"
                            }}
                        />
                    </Form.Item>

                    <Form.Item label="任务类型" name="taskType" rules={[{required: true, message: "请选择任务类型"}]}>
                        <Select options={taskTypeOptions}/>
                    </Form.Item>

                    <Form.Item label="开始时间" name="startDateTime" rules={[{required: true, message: "请选择开始时间"}]}>
                        <DatePicker showTime style={{width: "100%"}}/>
                    </Form.Item>

                    <Form.Item label="结束时间" name="endDateTime" rules={[{required: true, message: "请选择结束时间"}]}>
                        <DatePicker
                            showTime
                            style={{width: "100%"}}
                            disabledDate={(current) => {
                                const start = form.getFieldValue("startDateTime");
                                if (!start || !current) return false;
                                return current.isBefore(start, "day");
                            }}
                        />
                    </Form.Item>

                    <Form.Item label="排序" name="order">
                        <InputNumber
                            placeholder="可选"
                            style={{width: "100%"}}
                            step={0.1}
                            precision={2}
                            stringMode={false}
                        />
                    </Form.Item>

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

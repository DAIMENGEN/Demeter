import React, {useEffect, useMemo} from "react";
import {App, Button, Drawer, Form, Space, Spin, Typography} from "antd";
import dayjs, {type Dayjs} from "dayjs";
import {
    type CreateProjectTaskParams,
    ProjectTaskType,
    useCreateProjectTask,
    useProjectTaskAttributeConfigs
} from "@Webapp/api/modules/project";
import {
    buildAttributeTypeMap,
    buildDefaultCustomAttrsFromConfigs,
    normalizeCustomAttributesToStrings,
    renderCustomAttributeItems,
    type TaskDrawerFormValues
} from "../index.ts";
import {TaskDrawerFormFields} from "../task-drawer-form-fields";

const {Text} = Typography;

export interface CreateTaskDrawerProps {
    open: boolean;
    projectId: string;
    /** for parent selection */
    parentOptions: Array<{ value: string; label: string }>;
    /** preset parentId when opening (e.g., create subtask) */
    defaultParentId?: string;
    /** default order value */
    defaultOrder?: number;
    defaultRange?: {
        start: Dayjs;
        end: Dayjs;
    };
    /** default task type */
    defaultTaskType?: number;
    onCreated?: () => void;
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
                                                                       onCreated,
                                                                       onClose
                                                                   }) => {
    const {message} = App.useApp();
    const [form] = Form.useForm<TaskDrawerFormValues>();
    const {create, loading} = useCreateProjectTask();

    const {data: attributeConfigs, loading: attributeConfigsLoading} = useProjectTaskAttributeConfigs(projectId, open);

    const attributeTypeMap = useMemo(() => buildAttributeTypeMap(attributeConfigs), [attributeConfigs]);

    useEffect(() => {
        if (open) {
            const start = defaultRange?.start ?? dayjs();
            let end = defaultRange?.end ?? start.add(7, "day");

            // For checkpoint and milestone, set end date to match start date
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
        } else {
            form.resetFields();
        }
        // only re-init when opening or configs changed while open
    }, [open, form, defaultRange, attributeConfigs, defaultParentId, defaultOrder, defaultTaskType]);

    const submit = async () => {
        try {
            const values = await form.validateFields();

            const [startDateTime, endDateTime] = values.dateRange ?? [];
            if (!startDateTime || !endDateTime) return;

            const customAttributes = normalizeCustomAttributesToStrings(values.customAttributes, attributeTypeMap);

            const payload: CreateProjectTaskParams = {
                taskName: values.taskName,
                parentId: values.parentId ?? null,
                order: values.order,
                startDateTime: startDateTime.format("YYYY-MM-DDTHH:mm:ss"),
                endDateTime: endDateTime.format("YYYY-MM-DDTHH:mm:ss"),
                taskType: values.taskType,
                customAttributes
            };

            await create(projectId, payload);

            message.success("创建成功");
            onClose();
            onCreated?.();
        } catch (e: unknown) {
            const err = e as { message?: string };
            if (!err?.message) return;
            message.error(err.message || "创建失败");
        }
    };

    const customAttrItems = useMemo(() => {
        return renderCustomAttributeItems(attributeConfigs);
    }, [attributeConfigs]);

    return (
        <Drawer
            title="创建任务"
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
                            创建
                        </Button>
                    </Space>
                </div>
            }
        >
            <Spin spinning={loading} tip="正在创建...">
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

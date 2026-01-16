import React, {useEffect, useMemo} from "react";
import {App, Button, DatePicker, Drawer, Form, Input, InputNumber, Select, Space, Spin, Typography} from "antd";
import dayjs, {type Dayjs} from "dayjs";
import {
    AttributeTypeLabels,
    type CreateTaskParams,
    type JsonValue,
    TaskType,
    TaskTypeLabels,
    useCreateTask,
    useTaskAttributeConfigs
} from "@Webapp/api/modules/project";

const {Text} = Typography;

type SelectOption = { label: string; value: string };

const toSelectOptions = (raw: JsonValue | undefined): SelectOption[] => {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((x) => {
            if (typeof x === "string" || typeof x === "number" || typeof x === "boolean") {
                const v = String(x);
                return {label: v, value: v};
            }
            if (x && typeof x === "object" && !Array.isArray(x)) {
                const rec = x as Record<string, JsonValue>;
                const l = rec.label;
                const v = rec.value;
                if (typeof l === "string" && (typeof v === "string" || typeof v === "number" || typeof v === "boolean")) {
                    return {label: l, value: String(v)};
                }
            }
            return null;
        })
        .filter((x): x is SelectOption => Boolean(x));
};

export interface CreateTaskDrawerProps {
    open: boolean;
    projectId: string;
    /** for parent selection */
    parentOptions: Array<{ value: string; label: string }>;
    defaultRange?: {
        start: Dayjs;
        end: Dayjs;
    };
    onCreated?: () => void;
    onClose: () => void;
}

type CustomAttributeFormValue = JsonValue | Dayjs;

interface FormValues {
    taskName: string;
    parentId?: string;
    order?: number;
    startDateTime: Dayjs;
    endDateTime: Dayjs;
    taskType: number;
    /**
     * dynamic custom attributes
     * Note: Form state may contain Dayjs for date/datetime fields; we serialize into string on submit.
     */
    customAttributes?: Record<string, CustomAttributeFormValue>;
}

const toStringValue = (v: CustomAttributeFormValue): string | null => {
    if (v == null) return null;
    if (typeof v === "string") {
        const s = v.trim();
        return s ? s : null;
    }
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    // for DatePicker we may accidentally get a Dayjs object; try best-effort
    if (typeof v === "object" && !Array.isArray(v)) {
        const maybeDayjs = v as unknown as { format?: (fmt: string) => string };
        if (typeof maybeDayjs.format === "function") {
            return maybeDayjs.format("YYYY-MM-DDTHH:mm:ss");
        }
    }
    return null;
};

const normalizeCustomAttributesToStrings = (
    raw: Record<string, CustomAttributeFormValue> | undefined,
    attributeTypeMap: Map<string, string>
): Record<string, JsonValue> => {
    const out: Record<string, JsonValue> = {};

    for (const [key, value] of Object.entries(raw ?? {})) {
        const type = attributeTypeMap.get(key) ?? "text";

        // We always store string (or null) in customAttributes.
        // For date/datetime we format into a deterministic string.
        if (value == null) {
            out[key] = null;
            continue;
        }

        if (type === "date") {
            // DayPicker uses Dayjs; accept either Dayjs or string defensively.
            if (typeof value === "object" && !Array.isArray(value)) {
                const maybeDayjs = value as unknown as { isValid?: () => boolean; format?: (fmt: string) => string };
                if (typeof maybeDayjs.isValid === "function" && typeof maybeDayjs.format === "function" && maybeDayjs.isValid()) {
                    out[key] = maybeDayjs.format("YYYY-MM-DD");
                    continue;
                }
            }
            if (typeof value === "string") {
                const s = value.trim();
                out[key] = s ? s : null;
                continue;
            }
            out[key] = toStringValue(value);
            continue;
        }

        if (type === "datetime") {
            if (typeof value === "object" && !Array.isArray(value)) {
                const maybeDayjs = value as unknown as { isValid?: () => boolean; format?: (fmt: string) => string };
                if (typeof maybeDayjs.isValid === "function" && typeof maybeDayjs.format === "function" && maybeDayjs.isValid()) {
                    out[key] = maybeDayjs.format("YYYY-MM-DDTHH:mm:ss");
                    continue;
                }
            }
            if (typeof value === "string") {
                const s = value.trim();
                out[key] = s ? s : null;
                continue;
            }
            out[key] = toStringValue(value);
            continue;
        }

        // number/boolean/select/text/user: stringify
        out[key] = toStringValue(value);
    }

    // remove null entries (optional attributes not provided)
    for (const k of Object.keys(out)) {
        if (out[k] == null) delete out[k];
    }

    return out;
};

export const CreateTaskDrawer: React.FC<CreateTaskDrawerProps> = ({
                                                                       open,
                                                                       projectId,
                                                                       parentOptions,
                                                                       defaultRange,
                                                                       onCreated,
                                                                       onClose
                                                                   }) => {
    const {message} = App.useApp();
    const [form] = Form.useForm<FormValues>();
    const {create, loading} = useCreateTask();

    const isSubmitting = loading;

    const {data: attributeConfigs, loading: attributeConfigsLoading} = useTaskAttributeConfigs(projectId, open);

    const attributeTypeMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const cfg of attributeConfigs) {
            if (cfg.attributeName) map.set(cfg.attributeName, cfg.attributeType);
        }
        return map;
    }, [attributeConfigs]);

    useEffect(() => {
        if (open) {
            const start = defaultRange?.start ?? dayjs();
            const end = defaultRange?.end ?? start.add(7, "day");

            // init defaults for custom attributes
            const defaults: Record<string, CustomAttributeFormValue> = {};
            for (const cfg of attributeConfigs) {
                const key = cfg.attributeName;
                if (!key) continue;
                if (cfg.defaultValue != null && cfg.defaultValue !== "") {
                    // Default values are stored as string in DB.
                    // For date/datetime, Form/DatePicker expects Dayjs.
                    if (cfg.attributeType === "date") {
                        const d = dayjs(cfg.defaultValue);
                        defaults[key] = d.isValid() ? d : null;
                    } else if (cfg.attributeType === "datetime") {
                        const d = dayjs(cfg.defaultValue);
                        defaults[key] = d.isValid() ? d : null;
                    } else {
                        defaults[key] = cfg.defaultValue;
                    }
                }
            }

            form.setFieldsValue({
                taskType: TaskType.DEFAULT,
                startDateTime: start,
                endDateTime: end,
                customAttributes: defaults
            });
        } else {
            form.resetFields();
        }
        // only re-init when opening or configs changed while open
    }, [open, form, defaultRange, attributeConfigs]);

    const taskTypeOptions = useMemo(
        () =>
            [TaskType.UNKNOWN, TaskType.DEFAULT, TaskType.MILESTONE, TaskType.CHECKPOINT].map((v) => ({
                value: v,
                label: TaskTypeLabels[v]
            })),
        []
    );

    const submit = async () => {
        try {
            const values = await form.validateFields();

            if (values.endDateTime.isBefore(values.startDateTime)) {
                message.error("结束时间不能早于开始时间");
                return;
            }

            const customAttributes = normalizeCustomAttributesToStrings(values.customAttributes, attributeTypeMap);

            const payload: CreateTaskParams = {
                taskName: values.taskName,
                parentId: values.parentId ?? null,
                order: values.order ?? null,
                startDateTime: values.startDateTime.format("YYYY-MM-DDTHH:mm:ss"),
                endDateTime: values.endDateTime.format("YYYY-MM-DDTHH:mm:ss"),
                taskType: values.taskType,
                customAttributes
            };

            await create(projectId, payload);

            message.success("创建成功");
            onClose();
            onCreated?.();
        } catch (e: unknown) {
            // antd Form validation throws an object without a useful message; ignore it
            const err = e as { message?: string };
            if (!err?.message) return;
            message.error(err.message || "创建失败");
        }
    };

    const customAttrItems = useMemo(() => {
        return attributeConfigs
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((cfg) => {
                const name = cfg.attributeName;
                if (!name) return null;

                const label = (
                    <Space size={6}>
                        <span>{cfg.attributeLabel || cfg.attributeName}</span>
                        <Text type="secondary" style={{fontSize: 12}}>
                            ({AttributeTypeLabels[(cfg.attributeType as keyof typeof AttributeTypeLabels) ?? "text"] ?? cfg.attributeType})
                        </Text>
                    </Space>
                );

                const rules = cfg.isRequired
                    ? [{required: true as const, message: `请填写${cfg.attributeLabel || cfg.attributeName}`}]
                    : undefined;

                // Render by type; backend supports: text|number|boolean|date|datetime|select|...
                switch (cfg.attributeType) {
                    case "number":
                        return (
                            <Form.Item
                                key={cfg.id}
                                label={label}
                                name={["customAttributes", name]}
                                rules={rules}
                            >
                                <InputNumber style={{width: "100%"}} placeholder="请输入数字"/>
                            </Form.Item>
                        );
                    case "boolean":
                        return (
                            <Form.Item
                                key={cfg.id}
                                label={label}
                                name={["customAttributes", name]}
                                rules={rules}
                            >
                                <Select
                                    placeholder="请选择"
                                    allowClear
                                    options={[
                                        {label: "是", value: "true"},
                                        {label: "否", value: "false"}
                                    ]}
                                />
                            </Form.Item>
                        );
                    case "date":
                        return (
                            <Form.Item
                                key={cfg.id}
                                label={label}
                                name={["customAttributes", name]}
                                rules={rules}
                            >
                                <DatePicker style={{width: "100%"}}/>
                            </Form.Item>
                        );
                    case "datetime":
                        return (
                            <Form.Item
                                key={cfg.id}
                                label={label}
                                name={["customAttributes", name]}
                                rules={rules}
                            >
                                <DatePicker showTime style={{width: "100%"}}/>
                            </Form.Item>
                        );
                    case "select": {
                        const opts = toSelectOptions(cfg.options);

                        return (
                            <Form.Item key={cfg.id} label={label} name={["customAttributes", name]} rules={rules}>
                                <Select placeholder="请选择" allowClear options={opts}/>
                            </Form.Item>
                        );
                    }
                    case "user": {
                        // user type is also option-based: cfg.options stores {label,value} just like 'select'
                        const opts = toSelectOptions(cfg.options);

                        return (
                            <Form.Item key={cfg.id} label={label} name={["customAttributes", name]} rules={rules}>
                                <Select
                                    placeholder="请选择人员"
                                    allowClear
                                    showSearch={{
                                        optionFilterProp: "label"
                                    }}
                                    options={opts}
                                />
                            </Form.Item>
                        );
                    }
                    case "text":
                    default:
                        return (
                            <Form.Item key={cfg.id} label={label} name={["customAttributes", name]} rules={rules}>
                                <Input placeholder="请输入" allowClear/>
                            </Form.Item>
                        );
                }
            })
            .filter((x): x is React.ReactElement => Boolean(x));
    }, [attributeConfigs]);

    return (
        <Drawer
            title="创建任务"
            open={open}
            size={"large"}
            onClose={() => {
                if (isSubmitting) return;
                onClose();
            }}
            forceRender
            footer={
                <div style={{display: "flex", justifyContent: "flex-end"}}>
                    <Space>
                        <Button onClick={onClose} disabled={isSubmitting}>
                            取消
                        </Button>
                        <Button type="primary" loading={isSubmitting} disabled={isSubmitting} onClick={submit}>
                            创建
                        </Button>
                    </Space>
                </div>
            }
        >
            <Spin spinning={isSubmitting} tip="正在创建...">
                <Form layout="vertical" form={form} disabled={isSubmitting}>
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

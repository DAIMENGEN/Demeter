import React, {useEffect, useMemo, useState} from "react";
import {
    App,
    Button,
    Drawer,
    Form,
    Input,
    InputNumber,
    Popconfirm,
    Select,
    Space,
    Spin,
    Switch,
    Table,
    type TableColumnsType,
    Typography
} from "antd";
import {
    type AttributeType,
    AttributeTypeLabels,
    type CreateTaskAttributeConfigParams,
    type TaskAttributeConfig,
    useCreateTaskAttributeConfig,
    useDeleteTaskAttributeConfig,
    useTaskAttributeConfigs,
    useUpdateTaskAttributeConfig
} from "@Webapp/api/modules/project";
import {userApi, useUserSelectOptionsInfinite} from "@Webapp/api/modules/user";

import {SelectTypeFields} from "./select-type-fields";
import {UserTypeFields} from "./user-type-fields";
import {ValueColorMapFields} from "./value-color-map-fields";
import {DateTypeFields} from "./date-type-fields";
import {NumberTypeFields} from "./number-type-fields";
import {BooleanTypeFields} from "./boolean-type-fields";
import {
    normalizeColorMapToRows,
    normalizeOptionsToRows,
    normalizeUserOptionsToRows,
    rowsToColorMapJson,
    selectRowsToOptionsJson,
    userRowsToOptionsJson
} from "./serializers";
import type {FormValues} from "./types";
import {useDebouncedUserSearch} from "./use-debounced-user-search";

const {Text} = Typography;

export interface TaskAttributeConfigDrawerProps {
    open: boolean;
    projectId: string;
    onClose: () => void;
}

export const TaskAttributeConfigDrawer: React.FC<TaskAttributeConfigDrawerProps> = ({
                                                                                        open,
                                                                                        projectId,
                                                                                        onClose
                                                                                    }) => {
    const {message} = App.useApp();
    const [form] = Form.useForm<FormValues>();

    const {data, loading, refetch} = useTaskAttributeConfigs(projectId, open);
    const {create, loading: createLoading} = useCreateTaskAttributeConfig();
    const {update, loading: updateLoading} = useUpdateTaskAttributeConfig();
    const {remove, loading: deleteLoading} = useDeleteTaskAttributeConfig();
    const userPicker = useUserSelectOptionsInfinite({pageSize: 20, activeOnly: true});

    const {onUserSearch, resetUserSearch} = useDebouncedUserSearch({
        open,
        search: userPicker.search
    });

    const [editing, setEditing] = useState<TaskAttributeConfig | null>(null);

    const isSubmitting = createLoading || updateLoading;

    const resetToCreateMode = () => {
        setEditing(null);
        // 清空时同时重置搜索状态
        resetUserSearch();
        userPicker.reset();
        form.resetFields();
    };

    useEffect(() => {
        if (!open) {
            form.resetFields();
        }
    }, [open, form]);

    const attributeTypeOptions = useMemo(
        () =>
            (Object.keys(AttributeTypeLabels) as AttributeType[]).map((value) => ({
                value,
                label: AttributeTypeLabels[value]
            })),
        []
    );

    const columns: TableColumnsType<TaskAttributeConfig> = [
        {
            title: "字段名",
            dataIndex: "attributeName",
            width: 140,
            render: (v: string) => <Text code>{v}</Text>
        },
        {title: "显示名称", dataIndex: "attributeLabel", width: 160},
        {
            title: "类型",
            dataIndex: "attributeType",
            width: 120,
            render: (v: string) => AttributeTypeLabels[v as AttributeType] ?? v
        },
        {
            title: "必填",
            dataIndex: "isRequired",
            width: 80,
            render: (v: boolean) => (v ? "是" : "否")
        },
        {
            title: "排序",
            dataIndex: "order",
            width: 80,
            render: (v: number | null) => (v == null ? "-" : v)
        },
        {
            title: "操作",
            key: "actions",
            width: 200,
            render: (_, record) => {
                const isEditingRow = Boolean(editing && record.id === editing.id);
                const isEditingOtherRow = Boolean(editing && record.id !== editing.id);
                const isEditingAny = Boolean(editing);

                return (
                    <Space>
                        <Button
                            size="small"
                            disabled={isSubmitting || deleteLoading || isEditingRow || isEditingOtherRow}
                            onClick={async () => {
                                setEditing(record);

                                const type = (record.attributeType as AttributeType) ?? "text";

                                const defaultUserId = type === "user" ? (record.defaultValue ?? undefined) : undefined;

                                // user options：从后端 options 里反序列化成 {label,value}[]（labelInValue 格式）
                                const userOptionsRows = type === "user" ? normalizeUserOptionsToRows(record.options) : [];

                                // 先基于 options 找 label 回显，找不到再兜底用 id
                                const optFromOptions = defaultUserId
                                    ? userOptionsRows.find((x) => {
                                        const raw = x.value;
                                        const id = typeof raw === "string" ? raw : raw?.value;
                                        return id === defaultUserId;
                                    })
                                    : undefined;

                                const optFromOptionsLabel = optFromOptions?.label;
                                const fallbackOpt = defaultUserId
                                    ? {label: optFromOptionsLabel ?? defaultUserId, value: defaultUserId}
                                    : undefined;

                                form.setFieldsValue({
                                    attributeName: record.attributeName,
                                    attributeLabel: record.attributeLabel,
                                    attributeType: type,
                                    isRequired: record.isRequired,
                                    defaultValue: type === "user" ? undefined : (record.defaultValue ?? undefined),
                                    defaultUser: type === "user" ? (optFromOptions ? fallbackOpt : undefined) : undefined,
                                    order: record.order ?? undefined,
                                    optionsRows: type === "user" ? userOptionsRows : normalizeOptionsToRows(record.options),
                                    valueColorMapRows: normalizeColorMapToRows(record.valueColorMap)
                                });

                                // 确保默认 user 在下拉 options 中（antd Select labelInValue 需要）
                                if (type === "user" && userOptionsRows.length) {
                                    userPicker.setOptions((prev) => {
                                        const map = new Map(prev.map((x) => [x.value, x] as const));
                                        for (const r of userOptionsRows) {
                                            const raw = r.value;
                                            const id = typeof raw === "string" ? raw : raw?.value;
                                            if (!id) continue;
                                            map.set(id, {value: id, label: r.label});
                                        }
                                        return Array.from(map.values());
                                    });
                                }

                                if (type === "user" && defaultUserId && optFromOptions && !optFromOptionsLabel) {
                                    try {
                                        const resp = await userApi.getUserById(defaultUserId);
                                        if (resp.code === 200) {
                                            const u = resp.data;
                                            const opt = {value: u.id, label: `${u.fullName} (${u.username})`};

                                            userPicker.setOptions((prev) => {
                                                const map = new Map(prev.map((x) => [x.value, x] as const));
                                                map.set(opt.value, opt);
                                                return Array.from(map.values());
                                            });

                                            form.setFieldsValue({defaultUser: opt});
                                        }
                                    } catch {
                                        // ignore: 保留 fallbackOpt
                                    }
                                }
                            }}
                        >
                            {isEditingRow ? "正在编辑" : "编辑"}
                        </Button>
                        <Popconfirm
                            title="确认删除这个自定义字段？"
                            okText="删除"
                            okType="danger"
                            cancelText="取消"
                            disabled={isSubmitting || isEditingAny}
                            onConfirm={async () => {
                                if (isSubmitting || isEditingAny) return;

                                try {
                                    await remove(projectId, record.id);
                                    message.success("删除成功");
                                    await refetch();
                                } catch (e: unknown) {
                                    const err = e as { message?: string };
                                    message.error(err?.message || "删除失败");
                                }
                            }}
                        >
                            <Button size="small" danger loading={deleteLoading} disabled={isSubmitting || isEditingAny}>
                                删除
                            </Button>
                        </Popconfirm>
                    </Space>
                );
            }
        }
    ];

    const handleSubmit = async () => {
        if (isSubmitting) return;

        try {
            const values = await form.validateFields();

            const type = values.attributeType;

            // user 类型：默认人员必须在可选人员列表里
            if (type === "user") {
                const defaultUserId = values.defaultUser?.value;
                if (defaultUserId) {
                    const allowed = (values.optionsRows ?? []).some((raw) => {
                        const value = raw.value;
                        if (typeof value === "string") return false;
                        // user: value is { value: userId, label?: ReactNode }
                        return value.value === defaultUserId;
                    });
                    if (!allowed) {
                        message.error("默认人员必须存在于可选人员列表中，请先添加该人员或清空默认人员");
                        return;
                    }
                }
            }

            // valueColorMap：仅支持 select/user；并且 key 必须来自预设范围
            if (type === "select" || type === "user") {
                let allowedKeys: Set<string>;
                if (type === "select") {
                    allowedKeys = new Set(
                        (values.optionsRows ?? [])
                            .map((r) => (typeof r.value === "string" ? r.value.trim() : ""))
                            .filter(Boolean)
                    );
                } else {
                    allowedKeys = new Set(
                        (values.optionsRows ?? [])
                            .map((r) => {
                                const raw = r.value;
                                // user: value is { value: userId, label?: ReactNode }
                                if (!raw || typeof raw === "string") return "";
                                return (raw.value ?? "").trim();
                            })
                            .filter(Boolean)
                    );
                }
                for (const row of values.valueColorMapRows ?? []) {
                    const key = (row.value ?? "").trim();
                    if (key && !allowedKeys.has(key)) {
                        message.error(
                            "值颜色映射中的值必须来自已配置的可选范围，请先补充可选值/人员或删除该映射"
                        );
                        return;
                    }
                }
            }

            // select/user 都复用 optionsRows 作为 options
            const options =
                type === "select"
                    ? selectRowsToOptionsJson(values.optionsRows)
                    : type === "user"
                        ? userRowsToOptionsJson(values.optionsRows)
                        : null;

            const valueColorMap =
                type === "select" || type === "user" ? rowsToColorMapJson(values.valueColorMapRows) : null;

            // defaultValue: persist as string | null
            const defaultValue = type === "user" ? (values.defaultUser?.value ?? null) : (values.defaultValue ?? null);

            if (editing) {
                await update(projectId, editing.id, {
                    attributeLabel: values.attributeLabel,
                    isRequired: values.isRequired,
                    defaultValue,
                    options,
                    valueColorMap,
                    order: values.order ?? null
                });
                message.success("保存成功");
            } else {
                const payload: CreateTaskAttributeConfigParams = {
                    attributeName: values.attributeName,
                    attributeLabel: values.attributeLabel,
                    attributeType: values.attributeType,
                    isRequired: values.isRequired,
                    defaultValue,
                    options,
                    valueColorMap,
                    order: values.order ?? null
                };
                await create(projectId, payload);
                message.success("创建成功");
            }

            resetToCreateMode();
            await refetch();
        } catch (e: unknown) {
            // antd Form validate errors don't need to message.
            const err = e as { name?: string; message?: string };
            if (err?.name) return;
            message.error(err?.message || "操作失败");
        }
    };

    const modeTitle = editing ? "编辑自定义字段" : "新增自定义字段";

    return (
        <Drawer
            title="任务自定义字段配置"
            placement="right"
            open={open}
            onClose={() => {
                if (isSubmitting) return;
                onClose();
            }}
            afterOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    setEditing(null);
                    form.resetFields();
                }
            }}
            forceRender
            size="large"
            footer={
                <div style={{display: "flex", justifyContent: "space-between"}}>
                    <Space>
                        {editing ? (
                            <Button onClick={resetToCreateMode} disabled={isSubmitting}>
                                取消编辑
                            </Button>
                        ) : null}
                        <Button onClick={resetToCreateMode} disabled={isSubmitting}>
                            清空
                        </Button>
                        <Button onClick={onClose} disabled={isSubmitting}>
                            关闭
                        </Button>
                    </Space>
                    <Button type="primary" onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
                        {editing ? "保存" : "创建"}
                    </Button>
                </div>
            }
        >
            <Spin spinning={isSubmitting} tip={editing ? "正在保存..." : "正在创建..."}>
                <Space orientation="vertical" style={{width: "100%"}} size="middle">
                    <Text type="secondary">这里配置的是该项目下 Task 支持的额外字段。固定字段不在此处管理。</Text>

                    <Table<TaskAttributeConfig>
                        rowKey={(r) => r.id}
                        size="small"
                        columns={columns}
                        dataSource={data}
                        loading={loading}
                        pagination={false}
                        rowClassName={(record) => {
                            if (!editing) return "";
                            return record.id === editing.id ? "task-attr-config-editing-row" : "";
                        }}
                    />

                    <div>
                        <Typography.Title level={5} style={{marginBottom: 12}}>
                            {modeTitle}
                        </Typography.Title>

                        <Form
                            form={form}
                            layout="vertical"
                            disabled={isSubmitting}
                            initialValues={{
                                attributeType: "text",
                                isRequired: false,
                                optionsRows: [],
                                valueColorMapRows: []
                            }}
                        >
                            <Form.Item
                                name="attributeName"
                                label="字段名"
                                rules={[
                                    {required: true, message: "请输入字段名"},
                                    {
                                        pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
                                        message: "只能包含字母/数字/下划线，并且不能以数字开头"
                                    }
                                ]}
                                extra="用于存储的 key（建议使用英文 + 下划线）。创建后不能修改。"
                            >
                                <Input placeholder="例如：risk_level" disabled={Boolean(editing)}/>
                            </Form.Item>

                            <Form.Item
                                name="attributeType"
                                label="字段类型"
                                rules={[{required: true, message: "请选择字段类型"}]}
                            >
                                <Select options={attributeTypeOptions} disabled={Boolean(editing)}/>
                            </Form.Item>

                            <Form.Item
                                name="attributeLabel"
                                label="显示名称"
                                rules={[{required: true, message: "请输入显示名称"}]}
                            >
                                <Input placeholder="例如：风险等级"/>
                            </Form.Item>

                            <Form.Item name="isRequired" label="必填" valuePropName="checked">
                                <Switch/>
                            </Form.Item>

                            <Form.Item name="order" label="排序">
                                <InputNumber style={{width: "100%"}} min={0}/>
                            </Form.Item>

                            <Form.Item
                                noStyle
                                shouldUpdate={(prev, cur) =>
                                    prev.attributeType !== cur.attributeType || prev.optionsRows !== cur.optionsRows
                                }>
                                {({getFieldValue}) => {
                                    const type = getFieldValue("attributeType") as AttributeType | undefined;
                                    const optionsRows = (getFieldValue("optionsRows") as FormValues["optionsRows"]) ?? [];
                                    let valueOptions: { label: string; value: string }[] = [];
                                    if (type === "select") {
                                        valueOptions = (optionsRows
                                            .map((raw) => {
                                                // select: raw is { label: string, value: string }
                                                return {
                                                    value: raw.value,
                                                    label: raw.label
                                                };
                                            })
                                            .filter((x): x is { label: string; value: string } => Boolean(x)) as {
                                            label: string;
                                            value: string;
                                        }[]);
                                    } else if (type === "user") {
                                        valueOptions = (optionsRows
                                            .map((raw) => {
                                                const value = raw.value;
                                                // user: value is { value: userId, label?: ReactNode }
                                                if (!value || typeof value === "string") return null;
                                                return {
                                                    value: value.value,
                                                    label: value.label
                                                };
                                            })
                                            .filter((x): x is { label: string; value: string } => Boolean(x)) as {
                                            label: string;
                                            value: string;
                                        }[]);
                                    }
                                    return (
                                        <>
                                            {/* 通用默认值（除 select/user/date/datetime/number/boolean 外） */}
                                            {type &&
                                            type !== "select" &&
                                            type !== "user" &&
                                            type !== "date" &&
                                            type !== "datetime" &&
                                            type !== "number" &&
                                            type !== "boolean" ? (
                                                <Form.Item
                                                    name="defaultValue"
                                                    label="默认值"
                                                    extra="可选。新建任务时，如果该字段未填写，将自动使用默认值。"
                                                >
                                                    <Input placeholder="请输入默认值（将以字符串存储）" allowClear />
                                                </Form.Item>
                                            ) : null}

                                            {type === "number" ? <NumberTypeFields disabled={isSubmitting} /> : null}
                                            {type === "boolean" ? <BooleanTypeFields disabled={isSubmitting} /> : null}

                                            {type === "date" ? <DateTypeFields mode="date" /> : null}
                                            {type === "datetime" ? <DateTypeFields mode="datetime" /> : null}

                                            {type === "user" ? (
                                                <UserTypeFields
                                                    form={form}
                                                    userPicker={userPicker}
                                                    onUserSearch={onUserSearch}
                                                    resetUserSearch={resetUserSearch}
                                                />
                                            ) : null}

                                            {type === "select" ? <SelectTypeFields/> : null}

                                            {type === "select" || type === "user" ? (
                                                <ValueColorMapFields
                                                    valueOptions={valueOptions}
                                                    extra="可选。用于把某些值渲染为指定颜色。"
                                                />
                                            ) : null}
                                        </>
                                    );
                                }}
                            </Form.Item>
                        </Form>
                    </div>
                </Space>
            </Spin>

            <style>{`
                /* 当前正在编辑的那一行高亮 */
                .task-attr-config-editing-row > td {
                    background: rgba(22, 119, 255, 0.08) !important;
                }
                .task-attr-config-editing-row:hover > td {
                    background: rgba(22, 119, 255, 0.12) !important;
                }
            `}</style>
        </Drawer>
    );
};



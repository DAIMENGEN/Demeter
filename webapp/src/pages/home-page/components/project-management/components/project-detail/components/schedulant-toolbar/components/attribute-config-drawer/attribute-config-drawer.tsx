import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
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
    Tooltip,
    Typography
} from "antd";
import {DeleteOutlined, EditOutlined, LoadingOutlined} from "@ant-design/icons";
import {
    type CreateProjectTaskAttributeConfigParams,
    type ProjectTaskAttributeConfig,
    type ProjectTaskAttributeType,
    useProjectTaskAttributeConfigActions,
} from "@Webapp/api/modules/project";
import {userApi, useUserSelectOptions} from "@Webapp/api/modules/user";

import {SelectField} from "../select-field";
import {UserField} from "../user-field";
import {ColorMapField} from "../color-map-field";
import {DateField} from "../date-field";
import {NumberField} from "../number-field";
import {BooleanField} from "../boolean-field";
import {TextField} from "../text-field";
import {
    normalizeColorMapToRows,
    normalizeOptionsToRows,
    normalizeUserOptionsToRows,
    rowsToColorMapJson,
    selectRowsToOptionsJson,
    userRowsToOptionsJson
} from "../serializers.ts";
import type {FormValues} from "../types.ts";
import {useDebouncedUserSearch} from "../../hooks/use-debounced-user-search.ts";

const {Text} = Typography;

export interface TaskAttributeConfigDrawerProps {
    open: boolean;
    projectId: string;
    configs: ProjectTaskAttributeConfig[];
    configsLoading: boolean;
    refetchConfigs: () => Promise<void> | void;
    onClose: () => void;
}

export const AttributeConfigDrawer: React.FC<TaskAttributeConfigDrawerProps> = ({
                                                                                    open,
                                                                                    projectId,
                                                                                    configs,
                                                                                    configsLoading,
                                                                                    refetchConfigs,
                                                                                    onClose,
                                                                                }) => {
    const {t} = useTranslation();
    const {message} = App.useApp();
    const [form] = Form.useForm<FormValues>();

    // ─── API hooks ───────────────────────────────────
    const {
        loading: actionLoading,
        createConfig,
        updateConfig,
        deleteConfig
    } = useProjectTaskAttributeConfigActions();
    const userPicker = useUserSelectOptions({pageSize: 20, activeOnly: true});

    const {onUserSearch, resetUserSearch} = useDebouncedUserSearch({
        open,
        search: userPicker.search
    });

    const [editing, setEditing] = useState<ProjectTaskAttributeConfig | null>(null);

    const isSubmitting = actionLoading;

    // ─── 抽屉打开时刷新列表 ─────────────────────────
    useEffect(() => {
        if (open) {
            refetchConfigs();
        }
    }, [open, refetchConfigs]);

    // ─── reset helpers ───────────────────────────────
    const resetToCreateMode = useCallback(() => {
        setEditing(null);
        resetUserSearch();
        userPicker.reset();
        form.resetFields();
    }, [form, resetUserSearch, userPicker]);

    useEffect(() => {
        if (!open) {
            form.resetFields();
        }
    }, [open, form]);

    // ─── 字段类型选项 ────────────────────────────────
    const ATTRIBUTE_TYPE_KEYS: ProjectTaskAttributeType[] = ["text", "number", "boolean", "date", "datetime", "select", "user"];
    const attributeTypeLabelMap: Record<ProjectTaskAttributeType, string> = useMemo(() => ({
        text: t("attributeConfig.typeText"),
        number: t("attributeConfig.typeNumber"),
        boolean: t("attributeConfig.typeBoolean"),
        date: t("attributeConfig.typeDate"),
        datetime: t("attributeConfig.typeDatetime"),
        select: t("attributeConfig.typeSelect"),
        user: t("attributeConfig.typeUser"),
    }), [t]);
    const attributeTypeOptions = useMemo(
        () =>
            ATTRIBUTE_TYPE_KEYS.map((value) => ({
                value,
                label: attributeTypeLabelMap[value]
            })),
        [attributeTypeLabelMap]
    );

    // ─── 表格列 ──────────────────────────────────────
    const columns: TableColumnsType<ProjectTaskAttributeConfig> = [
        {title: t("attributeConfig.columnLabel"), dataIndex: "attributeLabel", width: 160},
        {
            title: t("attributeConfig.columnType"),
            dataIndex: "attributeType",
            width: 120,
            render: (v: string) => attributeTypeLabelMap[v as ProjectTaskAttributeType] ?? v
        },
        {
            title: t("attributeConfig.columnRequired"),
            dataIndex: "isRequired",
            width: 80,
            render: (v: boolean) => (v ? t("attributeConfig.yes") : t("attributeConfig.no"))
        },
        {
            title: t("attributeConfig.columnOrder"),
            dataIndex: "order",
            width: 80,
            render: (v: number | null) => (v == null ? "-" : v)
        },
        {
            title: t("attributeConfig.columnActions"),
            key: "actions",
            width: 120,
            render: (_, record) => {
                const isEditingRow = Boolean(editing && record.id === editing.id);
                const isEditingOtherRow = Boolean(editing && record.id !== editing.id);
                const isEditingAny = Boolean(editing);

                const editDisabled = isSubmitting || isEditingRow || isEditingOtherRow;
                const deleteDisabled = isSubmitting || isEditingAny;

                return (
                    <Space>
                        <Tooltip title={isEditingRow ? t("attributeConfig.editing") : t("common.edit")}>
                            <Button
                                size="small"
                                type="default"
                                aria-label={isEditingRow ? t("attributeConfig.editing") : t("common.edit")}
                                icon={isEditingRow ? <LoadingOutlined/> : <EditOutlined/>}
                                disabled={editDisabled}
                                onClick={async () => {
                                    setEditing(record);

                                    const type = (record.attributeType as ProjectTaskAttributeType) ?? "text";

                                    const defaultUserId =
                                        type === "user" ? (record.defaultValue ?? undefined) : undefined;

                                    // user options：从后端 options 反序列化成 labelInValue 格式
                                    const userOptionsRows =
                                        type === "user" ? normalizeUserOptionsToRows(record.options) : [];

                                    // 查找 label 回显
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
                                        attributeLabel: record.attributeLabel,
                                        attributeType: type,
                                        isRequired: record.isRequired,
                                        defaultValue: type === "user" ? undefined : (record.defaultValue ?? undefined),
                                        defaultUser: type === "user" ? (optFromOptions ? fallbackOpt : undefined) : undefined,
                                        order: record.order ?? undefined,
                                        optionsRows:
                                            type === "user" ? userOptionsRows : normalizeOptionsToRows(record.options),
                                        valueColorMapRows: normalizeColorMapToRows(record.valueColorMap)
                                    });

                                    // 确保 user options 在下拉中可用（labelInValue 需要）
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

                                    // 如果默认 user 的 label 缺失，异步获取
                                    if (type === "user" && defaultUserId && optFromOptions && !optFromOptionsLabel) {
                                        try {
                                            const resp = await userApi.getUserById(defaultUserId);
                                            const u = assertApiOkSafe(resp);
                                            if (u) {
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
                            />
                        </Tooltip>

                        <Popconfirm
                            title={t("attributeConfig.deleteFieldConfirm")}
                            okText={t("common.delete")}
                            okType="danger"
                            cancelText={t("common.cancel")}
                            disabled={deleteDisabled}
                            onConfirm={async () => {
                                if (deleteDisabled) return;
                                try {
                                    await deleteConfig(projectId, record.id);
                                    message.success(t("attributeConfig.deleteSuccess"));
                                    await refetchConfigs();
                                } catch (e: unknown) {
                                    const err = e as {message?: string};
                                    message.error(err?.message || t("attributeConfig.deleteFailed"));
                                }
                            }}
                        >
                            <Tooltip title={t("common.delete")}>
                                <Button
                                    size="small"
                                    type="dashed"
                                    danger
                                    aria-label={t("common.delete")}
                                    icon={<DeleteOutlined/>}
                                    loading={actionLoading}
                                    disabled={deleteDisabled}
                                />
                            </Tooltip>
                        </Popconfirm>
                    </Space>
                );
            }
        }
    ];

    // ─── 提交 ────────────────────────────────────────
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
                        return value.value === defaultUserId;
                    });
                    if (!allowed) {
                        message.error(t("attributeConfig.defaultUserNotInList"));
                        return;
                    }
                }
            }

            // valueColorMap：仅支持 select/user；key 必须来自预设范围
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
                            t("attributeConfig.colorMapValueError")
                        );
                        return;
                    }
                }
            }

            // 序列化 options
            const options =
                type === "select"
                    ? selectRowsToOptionsJson(values.optionsRows)
                    : type === "user"
                        ? userRowsToOptionsJson(values.optionsRows)
                        : null;

            const valueColorMap =
                type === "select" || type === "user" ? rowsToColorMapJson(values.valueColorMapRows) : null;

            // defaultValue: 统一为 string | null
            const defaultValue = type === "user" ? (values.defaultUser?.value ?? null) : (values.defaultValue ?? null);

            if (editing) {
                await updateConfig(projectId, editing.id, {
                    attributeLabel: values.attributeLabel,
                    isRequired: values.isRequired,
                    defaultValue,
                    options,
                    valueColorMap,
                    order: values.order ?? null
                });
                message.success(t("attributeConfig.saveSuccess"));
            } else {
                // 自动生成唯一字段名
                const existingNames = new Set((configs ?? []).map((c) => c.attributeName));
                let generatedName: string;
                do {
                    generatedName = "f_" + Math.random().toString(36).substring(2, 10);
                } while (existingNames.has(generatedName));

                const payload: CreateProjectTaskAttributeConfigParams = {
                    attributeName: generatedName,
                    attributeLabel: values.attributeLabel,
                    attributeType: values.attributeType,
                    isRequired: values.isRequired,
                    defaultValue,
                    options,
                    valueColorMap,
                    order: values.order ?? null
                };
                await createConfig(projectId, payload);
                message.success(t("attributeConfig.createSuccess"));
            }

            resetToCreateMode();
            await refetchConfigs();
        } catch (e: unknown) {
            // antd Form validate errors 无需 message
            const err = e as {name?: string; message?: string};
            if (err?.name) return;
            message.error(err?.message || t("attributeConfig.operationFailed"));
        }
    };

    const modeTitle = editing ? t("attributeConfig.editField") : t("attributeConfig.addField");

    return (
        <Drawer
            title={t("attributeConfig.drawerTitle")}
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
                                {t("attributeConfig.cancelEdit")}
                            </Button>
                        ) : null}
                        <Button onClick={resetToCreateMode} disabled={isSubmitting}>
                            {t("attributeConfig.clear")}
                        </Button>
                        <Button onClick={onClose} disabled={isSubmitting}>
                            {t("attributeConfig.close")}
                        </Button>
                    </Space>
                    <Button type="primary" onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
                        {editing ? t("common.save") : t("common.confirm")}
                    </Button>
                </div>
            }
        >
            <Spin spinning={isSubmitting} tip={editing ? t("attributeConfig.saving") : t("attributeConfig.creating")}>
                <Space orientation="vertical" style={{width: "100%"}} size="middle">
                    <Text type="secondary">{t("attributeConfig.description")}</Text>

                    <Table<ProjectTaskAttributeConfig>
                        rowKey={(r) => r.id}
                        size="small"
                        columns={columns}
                        dataSource={configs}
                        loading={configsLoading}
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
                                name="attributeType"
                                label={t("attributeConfig.fieldType")}
                                rules={[{required: true, message: t("attributeConfig.fieldTypeRequired")}]}
                            >
                                <Select options={attributeTypeOptions} disabled={Boolean(editing)}/>
                            </Form.Item>

                            <Form.Item
                                name="attributeLabel"
                                label={t("attributeConfig.displayName")}
                                rules={[{required: true, message: t("attributeConfig.displayNameRequired")}]}
                            >
                                <Input placeholder={t("attributeConfig.displayNamePlaceholder")}/>
                            </Form.Item>

                            <Form.Item name="isRequired" label={t("attributeConfig.required")} valuePropName="checked">
                                <Switch/>
                            </Form.Item>

                            <Form.Item name="order" label={t("attributeConfig.order")}>
                                <InputNumber style={{width: "100%"}} min={0}/>
                            </Form.Item>

                            <Form.Item
                                noStyle
                                shouldUpdate={(prev, cur) =>
                                    prev.attributeType !== cur.attributeType || prev.optionsRows !== cur.optionsRows
                                }>
                                {({getFieldValue}) => {
                                    const type = getFieldValue("attributeType") as ProjectTaskAttributeType | undefined;
                                    const optionsRows = (getFieldValue("optionsRows") as FormValues["optionsRows"]) ?? [];
                                    let valueOptions: {label: string; value: string}[] = [];
                                    if (type === "select") {
                                        valueOptions = optionsRows
                                            .map((raw) => ({
                                                value: typeof raw.value === "string" ? raw.value : "",
                                                label: raw.label
                                            }))
                                            .filter((x): x is {label: string; value: string} => Boolean(x.value));
                                    } else if (type === "user") {
                                        valueOptions = optionsRows
                                            .map((raw) => {
                                                const value = raw.value;
                                                if (!value || typeof value === "string") return null;
                                                return {
                                                    value: value.value,
                                                    label: value.label != null ? String(value.label) : raw.label
                                                };
                                            })
                                            .filter((x): x is {label: string; value: string} => Boolean(x));
                                    }
                                    return (
                                        <>
                                            {/* 通用默认值（不属于任何专用类型时才显示） */}
                                            {type &&
                                            type !== "text" &&
                                            type !== "select" &&
                                            type !== "user" &&
                                            type !== "date" &&
                                            type !== "datetime" &&
                                            type !== "number" &&
                                            type !== "boolean" ? (
                                                <Form.Item
                                                    name="defaultValue"
                                                    label={t("attributeConfig.defaultValue")}
                                                    extra={t("attributeConfig.defaultValueExtra")}
                                                >
                                                    <Input placeholder={t("attributeConfig.defaultValuePlaceholder")} allowClear/>
                                                </Form.Item>
                                            ) : null}

                                            {type === "text" ? <TextField disabled={isSubmitting}/> : null}
                                            {type === "number" ? <NumberField disabled={isSubmitting}/> : null}
                                            {type === "boolean" ? <BooleanField disabled={isSubmitting}/> : null}

                                            {type === "date" ? <DateField mode="date"/> : null}
                                            {type === "datetime" ? <DateField mode="datetime"/> : null}

                                            {type === "user" ? (
                                                <UserField
                                                    form={form}
                                                    userPicker={userPicker}
                                                    onUserSearch={onUserSearch}
                                                    resetUserSearch={resetUserSearch}
                                                />
                                            ) : null}

                                            {type === "select" ? <SelectField/> : null}

                                            {type === "select" || type === "user" ? (
                                                <ColorMapField
                                                    valueOptions={valueOptions}
                                                    extra={t("attributeConfig.colorMapExtra")}
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

// ─── 安全版本的 assertApiOk（不抛异常） ──────────────
function assertApiOkSafe<T>(resp: {code: number; data: T}): T | null {
    return resp.code === 200 ? resp.data : null;
}

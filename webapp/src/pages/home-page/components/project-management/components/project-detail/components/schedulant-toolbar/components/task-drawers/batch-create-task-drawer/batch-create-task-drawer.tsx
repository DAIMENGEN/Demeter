import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {
    Button,
    DatePicker,
    Input,
    InputNumber,
    Popconfirm,
    Select,
    Space,
    Table,
    Typography,
} from "antd";
import type {ColumnsType} from "antd/es/table";
import {DeleteOutlined, PlusOutlined, CopyOutlined, HolderOutlined} from "@ant-design/icons";
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {ResizableDrawer} from "@Webapp/components";
import dayjs, {type Dayjs} from "dayjs";
import {useTranslation} from "react-i18next";
import {
    type CreateProjectTaskParams,
    type ProjectTaskAttributeConfig,
    ProjectTaskType,
    useProjectTaskActions,
    useProjectTaskAttributeConfigList,
} from "@Webapp/api/modules/project";
import {
    buildAttributeTypeMap,
    buildDefaultCustomAttrsFromConfigs,
    normalizeCustomAttributesToStrings,
    toNaiveDateTimeString,
    toSelectOptions,
    type CustomAttributeFormValue,
} from "../index.ts";
import "./batch-create-task-drawer.scss";

const {Text} = Typography;

/* ------------------------------------------------------------------ */
/*  Drag-and-drop row context & components                             */
/* ------------------------------------------------------------------ */

interface RowContextProps {
    setActivatorNodeRef?: (element: HTMLElement | null) => void;
    listeners?: Record<string, Function>;
}

const RowContext = React.createContext<RowContextProps>({});

const DragHandle: React.FC = () => {
    const {setActivatorNodeRef, listeners} = useContext(RowContext);
    return (
        <HolderOutlined
            ref={setActivatorNodeRef}
            style={{cursor: "grab", color: "#999", touchAction: "none"}}
            {...listeners}
        />
    );
};

const SortableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = (props) => {
    const id = props["data-row-key" as keyof typeof props] as string;
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({id});

    const style: React.CSSProperties = {
        ...props.style,
        transform: CSS.Translate.toString(transform),
        transition,
        ...(isDragging ? {position: "relative", zIndex: 9999} : {}),
    };

    return (
        <RowContext.Provider value={{setActivatorNodeRef, listeners}}>
            <tr {...props} ref={setNodeRef} style={style} {...attributes} />
        </RowContext.Provider>
    );
};

/* ------------------------------------------------------------------ */
/*  Row type                                                           */
/* ------------------------------------------------------------------ */

interface BatchTaskRow {
    key: string;
    taskName: string;
    parentId?: string;
    taskType: number;
    startDateTime?: Dayjs;
    endDateTime?: Dayjs;
    order: number;
    customAttributes: Record<string, CustomAttributeFormValue>;
    /** per-field validation errors */
    _errors?: Record<string, string>;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface BatchCreateTaskDrawerProps {
    open: boolean;
    projectId: string;
    parentOptions: Array<{ value: string; label: string }>;
    defaultOrder?: number;
    defaultRange?: {
        start: Dayjs;
        end: Dayjs;
    };
    onSuccess?: () => void;
    onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Key generator                                                      */
/* ------------------------------------------------------------------ */

let _batchKeySeq = 0;
const nextKey = () => `batch_${++_batchKeySeq}_${Date.now()}`;

/* ------------------------------------------------------------------ */
/*  Helper: build one empty row                                        */
/* ------------------------------------------------------------------ */

const buildEmptyRow = (
    order: number,
    defaultRange: { start: Dayjs; end: Dayjs } | undefined,
    defaultCustomAttrs: Record<string, CustomAttributeFormValue>,
): BatchTaskRow => ({
    key: nextKey(),
    taskName: "",
    parentId: undefined,
    taskType: ProjectTaskType.DEFAULT,
    startDateTime: defaultRange?.start ?? dayjs(),
    endDateTime: defaultRange?.end ?? dayjs().add(7, "day"),
    order,
    customAttributes: {...defaultCustomAttrs},
});

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const BatchCreateTaskDrawer: React.FC<BatchCreateTaskDrawerProps> = ({
    open,
    projectId,
    parentOptions,
    defaultOrder = 1.0,
    defaultRange,
    onSuccess,
    onClose,
}) => {
    const {t} = useTranslation();
    const {batchCreateTasks, loading} = useProjectTaskActions();
    const {configs: attributeConfigs, loading: attributeConfigsLoading, fetchConfigs} = useProjectTaskAttributeConfigList();

    const attributeTypeMap = useMemo(() => buildAttributeTypeMap(attributeConfigs), [attributeConfigs]);

    // dnd-kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 5}}),
    );

    // Editable table data
    const [rows, setRows] = useState<BatchTaskRow[]>([]);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [addCount, setAddCount] = useState(1);

    // Editing cell state
    const [editingCell, setEditingCell] = useState<{ key: string; field: string } | null>(null);
    const inputRef = useRef<any>(null);

    // Track previous open state for rising-edge detection
    const prevOpenRef = useRef(false);

    // Default custom attrs derived from configs
    const defaultCustomAttrs = useMemo(
        () => buildDefaultCustomAttrsFromConfigs(attributeConfigs),
        [attributeConfigs],
    );

    // Fetch configs on open
    useEffect(() => {
        if (open && projectId) {
            fetchConfigs(projectId);
        }
    }, [open, projectId, fetchConfigs]);

    // Reset rows when drawer opens (rising edge only)
    useEffect(() => {
        if (open && !prevOpenRef.current) {
            setRows([buildEmptyRow(defaultOrder, defaultRange, defaultCustomAttrs)]);
            setSelectedRowKeys([]);
            setEditingCell(null);
        }
        prevOpenRef.current = open;
    }, [open, defaultOrder, defaultRange, defaultCustomAttrs]);

    // Backfill custom-attribute defaults after async configs arrive
    useEffect(() => {
        if (!open) return;
        if (Object.keys(defaultCustomAttrs).length === 0) return;

        setRows((prev) =>
            prev.map((row) => {
                const nextCustomAttrs = {...row.customAttributes};
                let changed = false;

                for (const [attrName, defaultValue] of Object.entries(defaultCustomAttrs)) {
                    const currentValue = nextCustomAttrs[attrName];
                    if (currentValue === undefined || currentValue === null || currentValue === "") {
                        nextCustomAttrs[attrName] = defaultValue;
                        changed = true;
                    }
                }

                if (!changed) return row;
                return {...row, customAttributes: nextCustomAttrs};
            }),
        );
    }, [open, defaultCustomAttrs]);

    // Focus input when editing cell changes
    useEffect(() => {
        if (editingCell) {
            setTimeout(() => inputRef.current?.focus?.(), 50);
        }
    }, [editingCell]);

    /* ---- Row mutations ---- */

    const updateRow = useCallback((key: string, field: string, value: unknown) => {
        setRows((prev) =>
            prev.map((r) => {
                if (r.key !== key) return r;
                const updated = {...r, _errors: {...(r._errors ?? {})}};
                // Clear error for edited field
                delete updated._errors[field];

                if (field.startsWith("customAttributes.")) {
                    const attrName = field.slice("customAttributes.".length);
                    updated.customAttributes = {...updated.customAttributes, [attrName]: value as CustomAttributeFormValue};
                } else {
                    (updated as any)[field] = value;
                }

                // Auto-sync dates for milestone/checkpoint
                if (field === "taskType") {
                    const isSingle = value === ProjectTaskType.CHECKPOINT || value === ProjectTaskType.MILESTONE;
                    if (isSingle && updated.startDateTime) {
                        updated.endDateTime = updated.startDateTime;
                    }
                }
                if (field === "startDateTime") {
                    const isSingle = updated.taskType === ProjectTaskType.CHECKPOINT || updated.taskType === ProjectTaskType.MILESTONE;
                    if (isSingle) {
                        updated.endDateTime = value as Dayjs;
                    }
                }

                return updated;
            }),
        );
    }, []);

    const addRows = useCallback((count: number) => {
        setRows((prev) => {
            const maxOrder = prev.length > 0 ? Math.max(...prev.map((r) => r.order)) : defaultOrder - 1;
            const newRows: BatchTaskRow[] = [];
            for (let i = 0; i < count; i++) {
                newRows.push(buildEmptyRow(maxOrder + i + 1, defaultRange, defaultCustomAttrs));
            }
            return [...prev, ...newRows];
        });
    }, [defaultOrder, defaultRange, defaultCustomAttrs]);

    const deleteRows = useCallback((keys: React.Key[]) => {
        const keySet = new Set(keys);
        setRows((prev) => prev.filter((r) => !keySet.has(r.key)));
        setSelectedRowKeys((prev) => prev.filter((k) => !keySet.has(k)));
    }, []);

    const handleDragEnd = useCallback(({active, over}: DragEndEvent) => {
        if (over && active.id !== over.id) {
            setRows((prev) => {
                const oldIndex = prev.findIndex((r) => r.key === active.id);
                const newIndex = prev.findIndex((r) => r.key === over.id);
                const reordered = arrayMove(prev, oldIndex, newIndex);
                // Recalculate order values based on new positions
                return reordered.map((row, i) => ({...row, order: i + 1}));
            });
        }
    }, []);

    const duplicateRow = useCallback((key: string) => {
        setRows((prev) => {
            const idx = prev.findIndex((r) => r.key === key);
            if (idx < 0) return prev;
            const source = prev[idx];
            const newRow: BatchTaskRow = {
                ...source,
                key: nextKey(),
                taskName: source.taskName ? `${source.taskName} (copy)` : "",
                customAttributes: {...source.customAttributes},
                _errors: undefined,
            };
            const next = [...prev];
            next.splice(idx + 1, 0, newRow);
            return next.map((row, i) => ({...row, order: i + 1}));
        });
    }, []);

    /* ---- Validation ---- */

    const validate = useCallback((): boolean => {
        let valid = true;
        setRows((prev) =>
            prev.map((row) => {
                const errors: Record<string, string> = {};
                if (!row.taskName.trim()) {
                    errors.taskName = t("task.taskNameRequired");
                    valid = false;
                }
                if (!row.startDateTime) {
                    errors.startDateTime = t("task.dateRangeRequired");
                    valid = false;
                }
                if (!row.endDateTime) {
                    errors.endDateTime = t("task.dateRangeRequired");
                    valid = false;
                }
                if (row.startDateTime && row.endDateTime && row.endDateTime.isBefore(row.startDateTime)) {
                    errors.endDateTime = t("task.dateRangeInvalid");
                    valid = false;
                }
                return {...row, _errors: Object.keys(errors).length > 0 ? errors : undefined};
            }),
        );
        return valid;
    }, [t]);

    /* ---- Submit ---- */

    const handleSubmit = useCallback(async () => {
        if (!validate()) return;

        const tasks: CreateProjectTaskParams[] = rows.map((row) => {
            const customAttributes = normalizeCustomAttributesToStrings(row.customAttributes, attributeTypeMap);
            return {
                taskName: row.taskName.trim(),
                parentId: row.parentId ?? null,
                order: row.order,
                startDateTime: toNaiveDateTimeString(row.startDateTime!),
                endDateTime: toNaiveDateTimeString(row.endDateTime!),
                taskType: row.taskType,
                customAttributes: Object.keys(customAttributes).length > 0 ? customAttributes : undefined,
            };
        });

        try {
            await batchCreateTasks(projectId, {tasks});
            onClose();
            onSuccess?.();
        } catch (error) {
            console.error("Batch create tasks failed:", error);
        }
    }, [rows, validate, batchCreateTasks, projectId, attributeTypeMap, onClose, onSuccess]);

    const handleCancel = useCallback(() => {
        setRows([]);
        setEditingCell(null);
        onClose();
    }, [onClose]);

    /* ---- Editable cell helpers ---- */

    const isEditing = useCallback(
        (key: string, field: string) => editingCell?.key === key && editingCell?.field === field,
        [editingCell],
    );

    const startEditing = useCallback(
        (key: string, field: string) => setEditingCell({key, field}),
        [],
    );

    const stopEditing = useCallback(() => setEditingCell(null), []);

    /* ---- Build table columns ---- */

    const activeConfigs = useMemo(
        () => (attributeConfigs ?? []).filter((c) => !c.isArchived).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        [attributeConfigs],
    );

    const taskTypeOptions = useMemo(
        () => [
            {value: ProjectTaskType.DEFAULT, label: t("task.taskTypeDefault")},
            {value: ProjectTaskType.MILESTONE, label: t("task.taskTypeMilestone")},
            {value: ProjectTaskType.CHECKPOINT, label: t("task.taskTypeCheckpoint")},
        ],
        [t],
    );

    const renderEditableCell = useCallback(
        (row: BatchTaskRow, field: string, renderView: () => React.ReactNode, renderEditor: () => React.ReactNode) => {
            const hasError = row._errors?.[field];
            if (isEditing(row.key, field)) {
                return <div className="editable-cell">{renderEditor()}</div>;
            }
            return (
                <div
                    className={`editable-cell-value-wrap ${hasError ? "cell-error" : ""}`}
                    style={hasError ? {borderColor: "#ff4d4f"} : undefined}
                    title={hasError}
                    onClick={() => startEditing(row.key, field)}
                >
                    {renderView() || <Text type="secondary" style={{fontSize: 12}}>-</Text>}
                </div>
            );
        },
        [isEditing, startEditing],
    );

    const buildCustomAttrColumn = useCallback(
        (cfg: ProjectTaskAttributeConfig): ColumnsType<BatchTaskRow>[number] => {
            const attrName = cfg.attributeName;
            const field = `customAttributes.${attrName}`;

            const renderView = (row: BatchTaskRow) => {
                const val = row.customAttributes[attrName];
                if (val == null || val === "") return null;
                if (typeof val === "object" && "format" in (val as object)) {
                    return (val as unknown as Dayjs).format(cfg.attributeType === "date" ? "YYYY-MM-DD" : "YYYY-MM-DD HH:mm:ss");
                }
                if (typeof val === "boolean") return val ? t("task.selectYes") : t("task.selectNo");
                // For select/user types, look up the label from options
                if (cfg.attributeType === "select" || cfg.attributeType === "user") {
                    const opts = toSelectOptions(cfg.options ?? undefined);
                    const matched = opts.find((o) => o.value === String(val));
                    return matched?.label ?? String(val);
                }
                return String(val);
            };

            const renderEditor = (row: BatchTaskRow) => {
                const val = row.customAttributes[attrName];
                switch (cfg.attributeType) {
                    case "number":
                        return (
                            <InputNumber
                                ref={inputRef}
                                size="small"
                                style={{width: "100%"}}
                                value={val as number | undefined}
                                onChange={(v) => updateRow(row.key, field, v)}
                                onBlur={stopEditing}
                                onPressEnter={stopEditing}
                            />
                        );
                    case "boolean":
                        return (
                            <Select
                                ref={inputRef}
                                size="small"
                                style={{width: "100%"}}
                                value={val as string | undefined}
                                options={[
                                    {label: t("task.selectYes"), value: "true"},
                                    {label: t("task.selectNo"), value: "false"},
                                ]}
                                allowClear
                                onChange={(v) => {
                                    updateRow(row.key, field, v);
                                    stopEditing();
                                }}
                                onBlur={stopEditing}
                            />
                        );
                    case "date":
                        return (
                            <DatePicker
                                ref={inputRef}
                                size="small"
                                style={{width: "100%"}}
                                value={val && typeof val === "object" && "format" in (val as object) ? (val as unknown as Dayjs) : undefined}
                                onChange={(v) => {
                                    updateRow(row.key, field, v);
                                    stopEditing();
                                }}
                                onOpenChange={(open) => { if (!open) stopEditing(); }}
                            />
                        );
                    case "datetime":
                        return (
                            <DatePicker
                                ref={inputRef}
                                size="small"
                                showTime
                                style={{width: "100%"}}
                                value={val && typeof val === "object" && "format" in (val as object) ? (val as unknown as Dayjs) : undefined}
                                onChange={(v) => {
                                    updateRow(row.key, field, v);
                                    stopEditing();
                                }}
                                onOpenChange={(open) => { if (!open) stopEditing(); }}
                            />
                        );
                    case "select": {
                        const opts = toSelectOptions(cfg.options ?? undefined);
                        return (
                            <Select
                                ref={inputRef}
                                size="small"
                                style={{width: "100%"}}
                                value={val as string | undefined}
                                options={opts}
                                allowClear
                                onChange={(v) => {
                                    updateRow(row.key, field, v);
                                    stopEditing();
                                }}
                                onBlur={stopEditing}
                            />
                        );
                    }
                    case "user": {
                        const opts = toSelectOptions(cfg.options ?? undefined);
                        return (
                            <Select
                                ref={inputRef}
                                size="small"
                                style={{width: "100%"}}
                                value={val as string | undefined}
                                options={opts}
                                allowClear
                                showSearch
                                onChange={(v) => {
                                    updateRow(row.key, field, v);
                                    stopEditing();
                                }}
                                onBlur={stopEditing}
                            />
                        );
                    }
                    case "text":
                    default:
                        return (
                            <Input
                                ref={inputRef}
                                size="small"
                                value={val as string | undefined}
                                onChange={(e) => updateRow(row.key, field, e.target.value)}
                                onBlur={stopEditing}
                                onPressEnter={stopEditing}
                            />
                        );
                }
            };

            return {
                title: cfg.attributeLabel || cfg.attributeName,
                dataIndex: ["customAttributes", attrName],
                width: 140,
                render: (_: unknown, row: BatchTaskRow) =>
                    renderEditableCell(row, field, () => renderView(row), () => renderEditor(row)),
            };
        },
        [renderEditableCell, updateRow, stopEditing, t],
    );

    const columns = useMemo((): ColumnsType<BatchTaskRow> => {
        const base: ColumnsType<BatchTaskRow> = [
            {
                key: "sort",
                width: 40,
                fixed: "left",
                align: "center",
                render: () => <DragHandle/>,
            },
            {
                title: "#",
                width: 50,
                fixed: "left",
                render: (_: unknown, __: unknown, index: number) => index + 1,
            },
            {
                title: t("task.taskName"),
                dataIndex: "taskName",
                width: 200,
                fixed: "left",
                render: (_: unknown, row: BatchTaskRow) =>
                    renderEditableCell(
                        row,
                        "taskName",
                        () => row.taskName || null,
                        () => (
                            <Input
                                ref={inputRef}
                                size="small"
                                value={row.taskName}
                                placeholder={t("task.taskNamePlaceholder")}
                                onChange={(e) => updateRow(row.key, "taskName", e.target.value)}
                                onBlur={stopEditing}
                                onPressEnter={stopEditing}
                            />
                        ),
                    ),
            },
            {
                title: t("task.parentTask"),
                dataIndex: "parentId",
                width: 160,
                render: (_: unknown, row: BatchTaskRow) =>
                    renderEditableCell(
                        row,
                        "parentId",
                        () => {
                            const opt = parentOptions.find((o) => o.value === row.parentId);
                            return opt?.label ?? null;
                        },
                        () => (
                            <Select
                                ref={inputRef}
                                size="small"
                                style={{width: "100%"}}
                                value={row.parentId}
                                options={parentOptions}
                                placeholder={t("task.parentTaskPlaceholder")}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                onChange={(v) => {
                                    updateRow(row.key, "parentId", v);
                                    stopEditing();
                                }}
                                onBlur={stopEditing}
                            />
                        ),
                    ),
            },
            {
                title: t("task.taskType"),
                dataIndex: "taskType",
                width: 120,
                render: (_: unknown, row: BatchTaskRow) =>
                    renderEditableCell(
                        row,
                        "taskType",
                        () => taskTypeOptions.find((o) => o.value === row.taskType)?.label ?? null,
                        () => (
                            <Select
                                ref={inputRef}
                                size="small"
                                style={{width: "100%"}}
                                value={row.taskType}
                                options={taskTypeOptions}
                                onChange={(v) => {
                                    updateRow(row.key, "taskType", v);
                                    stopEditing();
                                }}
                                onBlur={stopEditing}
                            />
                        ),
                    ),
            },
            {
                title: t("task.startTime"),
                dataIndex: "startDateTime",
                width: 170,
                render: (_: unknown, row: BatchTaskRow) =>
                    renderEditableCell(
                        row,
                        "startDateTime",
                        () => row.startDateTime?.format("YYYY-MM-DD") ?? null,
                        () => (
                            <DatePicker
                                ref={inputRef}
                                size="small"
                                style={{width: "100%"}}
                                value={row.startDateTime}
                                onChange={(v) => {
                                    updateRow(row.key, "startDateTime", v);
                                    stopEditing();
                                }}
                                onOpenChange={(open) => { if (!open) stopEditing(); }}
                            />
                        ),
                    ),
            },
            {
                title: t("task.endTime"),
                dataIndex: "endDateTime",
                width: 170,
                render: (_: unknown, row: BatchTaskRow) =>
                    renderEditableCell(
                        row,
                        "endDateTime",
                        () => row.endDateTime?.format("YYYY-MM-DD") ?? null,
                        () => (
                            <DatePicker
                                ref={inputRef}
                                size="small"
                                style={{width: "100%"}}
                                value={row.endDateTime}
                                onChange={(v) => {
                                    updateRow(row.key, "endDateTime", v);
                                    stopEditing();
                                }}
                                onOpenChange={(open) => { if (!open) stopEditing(); }}
                            />
                        ),
                    ),
            },
        ];

        // Dynamic custom attribute columns
        const customCols = activeConfigs.map((cfg) => buildCustomAttrColumn(cfg));

        // Action column
        const actionCol: ColumnsType<BatchTaskRow>[number] = {
            title: t("common.operation"),
            width: 80,
            fixed: "right",
            render: (_: unknown, row: BatchTaskRow) => (
                <Space size={4}>
                    <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined/>}
                        onClick={() => duplicateRow(row.key)}
                    />
                    <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined/>}
                        onClick={() => deleteRows([row.key])}
                    />
                </Space>
            ),
        };

        return [...base, ...customCols, actionCol];
    }, [
        t, renderEditableCell, updateRow, stopEditing, parentOptions, taskTypeOptions,
        activeConfigs, buildCustomAttrColumn, duplicateRow, deleteRows,
    ]);

    /* ---- Footer ---- */

    const footer = useMemo(
        () => (
            <div className="batch-create-drawer-footer">
                <Text type="secondary">
                    {t("task.batchCreateCount", {count: rows.length})}
                </Text>
                <Space>
                    <Button onClick={handleCancel} disabled={loading}>
                        {t("common.cancel")}
                    </Button>
                    <Button type="primary" onClick={handleSubmit} loading={loading} disabled={rows.length === 0}>
                        {t("common.submit")}
                    </Button>
                </Space>
            </div>
        ),
        [handleCancel, handleSubmit, loading, rows.length, t],
    );

    return (
        <ResizableDrawer
            title={t("task.batchCreateTask")}
            onClose={handleCancel}
            open={open}
            defaultSize={1200}
            classNames={{body: "batch-create-task-drawer-body"}}
            footer={footer}
            destroyOnHidden
        >
            {/* Toolbar */}
            <div className="batch-create-toolbar">
                <div className="batch-create-toolbar__left">
                    <Button icon={<PlusOutlined/>} onClick={() => addRows(1)}>
                        {t("task.batchAddRow")}
                    </Button>
                    <Space.Compact size="middle">
                        <InputNumber
                            min={1}
                            max={100}
                            value={addCount}
                            onChange={(v) => setAddCount(v ?? 1)}
                            style={{width: 60}}
                        />
                        <Button onClick={() => addRows(addCount)}>
                            {t("task.batchAddNRows", {count: addCount})}
                        </Button>
                    </Space.Compact>
                </div>
                <div className="batch-create-toolbar__right">
                    {selectedRowKeys.length > 0 && (
                        <Popconfirm
                            title={t("task.batchDeleteSelectedConfirm", {count: selectedRowKeys.length})}
                            onConfirm={() => deleteRows(selectedRowKeys)}
                            okText={t("common.confirm")}
                            cancelText={t("common.cancel")}
                        >
                            <Button danger icon={<DeleteOutlined/>}>
                                {t("task.batchDeleteSelected", {count: selectedRowKeys.length})}
                            </Button>
                        </Popconfirm>
                    )}
                </div>
            </div>

            {/* Editable table */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={rows.map((r) => r.key)} strategy={verticalListSortingStrategy}>
                    <Table<BatchTaskRow>
                        className="batch-create-table"
                        columns={columns}
                        dataSource={rows}
                        rowKey="key"
                        pagination={false}
                        size="small"
                        scroll={{x: "max-content"}}
                        loading={attributeConfigsLoading}
                        components={{body: {row: SortableRow}}}
                        rowSelection={{
                            selectedRowKeys,
                            onChange: setSelectedRowKeys,
                            columnWidth: 40,
                            renderCell: (_checked, _record, _index, originNode) => originNode,
                        }}
                        rowClassName={(row) => (row._errors ? "row-error" : "")}
                    />
                </SortableContext>
            </DndContext>
        </ResizableDrawer>
    );
};

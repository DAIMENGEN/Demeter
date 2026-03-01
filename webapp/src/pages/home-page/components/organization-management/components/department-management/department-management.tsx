import React, {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {App, Button, Form, Input, Popconfirm, Space, Table, Tooltip, Typography,} from "antd";
import {ResizableDrawer} from "@Webapp/components";
import type {ColumnsType, TablePaginationConfig} from "antd/es/table";
import {DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined,} from "@ant-design/icons";
import type {Department, DepartmentQueryParams} from "@Webapp/api/modules/organization/department";
import {useDepartmentActions, useDepartmentList} from "@Webapp/api/modules/organization/department";
import "./department-management.scss";

const {Title} = Typography;
const {TextArea} = Input;

export const DepartmentManagement: React.FC = () => {
    const {t} = useTranslation();
    const {message} = App.useApp();

    const {departments, loading, pagination, fetchDepartments, setPagination} = useDepartmentList();
    const {loading: actionLoading, createDepartment, updateDepartment, deleteDepartment} = useDepartmentActions();

    const [keyword, setKeyword] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [form] = Form.useForm();

    const buildQueryParams = useCallback(
        (page?: number, pageSize?: number): DepartmentQueryParams => ({
            page: page ?? pagination.page,
            pageSize: pageSize ?? pagination.pageSize,
            departmentName: keyword || undefined,
        }),
        [keyword, pagination.page, pagination.pageSize]
    );

    useEffect(() => {
        fetchDepartments(buildQueryParams());
    }, [fetchDepartments, buildQueryParams]);

    const handleSearch = useCallback(() => {
        fetchDepartments(buildQueryParams(1));
    }, [fetchDepartments, buildQueryParams]);

    const handleReset = useCallback(() => {
        setKeyword("");
        fetchDepartments({page: 1, pageSize: pagination.pageSize});
    }, [fetchDepartments, pagination.pageSize]);

    const handleRefresh = useCallback(() => {
        fetchDepartments(buildQueryParams());
    }, [fetchDepartments, buildQueryParams]);

    const handleTableChange = useCallback(
        (paginationConfig: TablePaginationConfig) => {
            const newPage = paginationConfig.current ?? 1;
            const newPageSize = paginationConfig.pageSize ?? 10;
            setPagination((prev) => ({...prev, page: newPage, pageSize: newPageSize}));
            fetchDepartments(buildQueryParams(newPage, newPageSize));
        },
        [fetchDepartments, buildQueryParams, setPagination]
    );

    const handleOpenCreate = useCallback(() => {
        setEditingDept(null);
        form.resetFields();
        setDrawerOpen(true);
    }, [form]);

    const handleOpenEdit = useCallback(
        (dept: Department) => {
            setEditingDept(dept);
            form.setFieldsValue({
                departmentName: dept.departmentName,
                description: dept.description ?? "",
            });
            setDrawerOpen(true);
        },
        [form]
    );

    const handleDrawerClose = useCallback(() => {
        setDrawerOpen(false);
        setEditingDept(null);
        form.resetFields();
    }, [form]);

    const handleSubmit = useCallback(async () => {
        try {
            const values = await form.validateFields();
            if (editingDept) {
                await updateDepartment(editingDept.id, {
                    departmentName: values.departmentName,
                    description: values.description || undefined,
                });
                message.success(t("departmentManagement.updateSuccess"));
            } else {
                await createDepartment({
                    departmentName: values.departmentName,
                    description: values.description || undefined,
                });
                message.success(t("departmentManagement.createSuccess"));
            }
            handleDrawerClose();
            handleRefresh();
        } catch (e: unknown) {
            const err = e as {name?: string; message?: string};
            if (err?.name) return;
            message.error(err?.message || t("departmentManagement.operationFailed"));
        }
    }, [form, editingDept, updateDepartment, createDepartment, message, t, handleDrawerClose, handleRefresh]);

    const handleDelete = useCallback(
        async (id: string) => {
            try {
                await deleteDepartment(id);
                message.success(t("departmentManagement.deleteSuccess"));
                handleRefresh();
            } catch (e: unknown) {
                const err = e as {message?: string};
                message.error(err?.message || t("departmentManagement.deleteFailed"));
            }
        },
        [deleteDepartment, message, t, handleRefresh]
    );

    const columns: ColumnsType<Department> = [
        {
            title: t("departmentManagement.name"),
            dataIndex: "departmentName",
            key: "departmentName",
            width: 200,
            ellipsis: true,
        },
        {
            title: t("departmentManagement.description"),
            dataIndex: "description",
            key: "description",
            ellipsis: true,
            render: (text: string) => text || "-",
        },
        {
            title: t("departmentManagement.createDateTime"),
            dataIndex: "createDateTime",
            key: "createDateTime",
            width: 180,
            render: (dt: string) => (dt ? new Date(dt).toLocaleString() : "-"),
        },
        {
            title: t("common.operation"),
            key: "action",
            width: 120,
            fixed: "right",
            render: (_: unknown, record: Department) => (
                <Space size="small">
                    <Tooltip title={t("common.edit")}>
                        <Button
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleOpenEdit(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title={t("departmentManagement.deleteConfirm")}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t("common.confirm")}
                        cancelText={t("common.cancel")}
                    >
                        <Tooltip title={t("common.delete")}>
                            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="department-management">
            <div className="department-management-header">
                <Title level={4}>{t("departmentManagement.title")}</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
                    {t("departmentManagement.create")}
                </Button>
            </div>

            <div className="department-management-filters">
                <Space wrap size="middle">
                    <Input
                        placeholder={t("departmentManagement.searchPlaceholder")}
                        prefix={<SearchOutlined />}
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onPressEnter={handleSearch}
                        allowClear
                        style={{width: 240}}
                    />
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                        {t("common.search")}
                    </Button>
                    <Button onClick={handleReset}>{t("common.reset")}</Button>
                    <Tooltip title={t("departmentManagement.refresh")}>
                        <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                    </Tooltip>
                </Space>
            </div>

            <Table<Department>
                columns={columns}
                dataSource={departments}
                rowKey="id"
                loading={loading}
                pagination={{
                    current: pagination.page,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showTotal: (total) => t("departmentManagement.totalCount", {total}),
                    pageSizeOptions: ["10", "20", "50"],
                }}
                onChange={handleTableChange}
            />

            <ResizableDrawer
                title={editingDept ? t("departmentManagement.edit") : t("departmentManagement.create")}
                open={drawerOpen}
                onClose={handleDrawerClose}
                footer={
                    <Space style={{display: "flex", justifyContent: "flex-end"}}>
                        <Button onClick={handleDrawerClose}>{t("common.cancel")}</Button>
                        <Button type="primary" onClick={handleSubmit} loading={actionLoading}>
                            {editingDept ? t("common.save") : t("common.confirm")}
                        </Button>
                    </Space>
                }
            >
                <Form form={form} layout="vertical" disabled={actionLoading}>
                    <Form.Item
                        name="departmentName"
                        label={t("departmentManagement.name")}
                        rules={[{required: true, message: t("departmentManagement.nameRequired")}]}
                    >
                        <Input placeholder={t("departmentManagement.namePlaceholder")} allowClear />
                    </Form.Item>
                    <Form.Item name="description" label={t("departmentManagement.description")}>
                        <TextArea
                            placeholder={t("departmentManagement.descriptionPlaceholder")}
                            rows={4}
                            allowClear
                        />
                    </Form.Item>
                </Form>
            </ResizableDrawer>
        </div>
    );
};

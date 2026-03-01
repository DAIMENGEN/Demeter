import React, {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {App, Button, Form, Input, Popconfirm, Space, Table, Tooltip, Typography,} from "antd";
import {ResizableDrawer} from "@Webapp/components";
import type {ColumnsType, TablePaginationConfig} from "antd/es/table";
import {DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined,} from "@ant-design/icons";
import type {Team, TeamQueryParams} from "@Webapp/api/modules/organization/team";
import {useTeamActions, useTeamList} from "@Webapp/api/modules/organization/team";
import "./team-management.scss";

const {Title} = Typography;
const {TextArea} = Input;

export const TeamManagement: React.FC = () => {
    const {t} = useTranslation();
    const {message} = App.useApp();

    const {teams, loading, pagination, fetchTeams, setPagination} = useTeamList();
    const {loading: actionLoading, createTeam, updateTeam, deleteTeam} = useTeamActions();

    const [keyword, setKeyword] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [form] = Form.useForm();

    const buildQueryParams = useCallback(
        (page?: number, pageSize?: number): TeamQueryParams => ({
            page: page ?? pagination.page,
            pageSize: pageSize ?? pagination.pageSize,
            teamName: keyword || undefined,
        }),
        [keyword, pagination.page, pagination.pageSize]
    );

    useEffect(() => {
        fetchTeams(buildQueryParams());
    }, [fetchTeams, buildQueryParams]);

    const handleSearch = useCallback(() => {
        fetchTeams(buildQueryParams(1));
    }, [fetchTeams, buildQueryParams]);

    const handleReset = useCallback(() => {
        setKeyword("");
        fetchTeams({page: 1, pageSize: pagination.pageSize});
    }, [fetchTeams, pagination.pageSize]);

    const handleRefresh = useCallback(() => {
        fetchTeams(buildQueryParams());
    }, [fetchTeams, buildQueryParams]);

    const handleTableChange = useCallback(
        (paginationConfig: TablePaginationConfig) => {
            const newPage = paginationConfig.current ?? 1;
            const newPageSize = paginationConfig.pageSize ?? 10;
            setPagination((prev) => ({...prev, page: newPage, pageSize: newPageSize}));
            fetchTeams(buildQueryParams(newPage, newPageSize));
        },
        [fetchTeams, buildQueryParams, setPagination]
    );

    const handleOpenCreate = useCallback(() => {
        setEditingTeam(null);
        form.resetFields();
        setDrawerOpen(true);
    }, [form]);

    const handleOpenEdit = useCallback(
        (team: Team) => {
            setEditingTeam(team);
            form.setFieldsValue({
                teamName: team.teamName,
                description: team.description ?? "",
            });
            setDrawerOpen(true);
        },
        [form]
    );

    const handleDrawerClose = useCallback(() => {
        setDrawerOpen(false);
        setEditingTeam(null);
        form.resetFields();
    }, [form]);

    const handleSubmit = useCallback(async () => {
        try {
            const values = await form.validateFields();
            if (editingTeam) {
                await updateTeam(editingTeam.id, {
                    teamName: values.teamName,
                    description: values.description || undefined,
                });
                message.success(t("teamManagement.updateSuccess"));
            } else {
                await createTeam({
                    teamName: values.teamName,
                    description: values.description || undefined,
                });
                message.success(t("teamManagement.createSuccess"));
            }
            handleDrawerClose();
            handleRefresh();
        } catch (e: unknown) {
            const err = e as {name?: string; message?: string};
            if (err?.name) return;
            message.error(err?.message || t("teamManagement.operationFailed"));
        }
    }, [form, editingTeam, updateTeam, createTeam, message, t, handleDrawerClose, handleRefresh]);

    const handleDelete = useCallback(
        async (id: string) => {
            try {
                await deleteTeam(id);
                message.success(t("teamManagement.deleteSuccess"));
                handleRefresh();
            } catch (e: unknown) {
                const err = e as {message?: string};
                message.error(err?.message || t("teamManagement.deleteFailed"));
            }
        },
        [deleteTeam, message, t, handleRefresh]
    );

    const columns: ColumnsType<Team> = [
        {
            title: t("teamManagement.name"),
            dataIndex: "teamName",
            key: "teamName",
            width: 200,
            ellipsis: true,
        },
        {
            title: t("teamManagement.description"),
            dataIndex: "description",
            key: "description",
            ellipsis: true,
            render: (text: string) => text || "-",
        },
        {
            title: t("teamManagement.createDateTime"),
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
            render: (_: unknown, record: Team) => (
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
                        title={t("teamManagement.deleteConfirm")}
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
        <div className="team-management">
            <div className="team-management-header">
                <Title level={4}>{t("teamManagement.title")}</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
                    {t("teamManagement.create")}
                </Button>
            </div>

            <div className="team-management-filters">
                <Space wrap size="middle">
                    <Input
                        placeholder={t("teamManagement.searchPlaceholder")}
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
                    <Tooltip title={t("teamManagement.refresh")}>
                        <Button icon={<ReloadOutlined />} onClick={handleRefresh} />
                    </Tooltip>
                </Space>
            </div>

            <Table<Team>
                columns={columns}
                dataSource={teams}
                rowKey="id"
                loading={loading}
                pagination={{
                    current: pagination.page,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showTotal: (total) => t("teamManagement.totalCount", {total}),
                    pageSizeOptions: ["10", "20", "50"],
                }}
                onChange={handleTableChange}
            />

            <ResizableDrawer
                title={editingTeam ? t("teamManagement.edit") : t("teamManagement.create")}
                open={drawerOpen}
                onClose={handleDrawerClose}
                footer={
                    <Space style={{display: "flex", justifyContent: "flex-end"}}>
                        <Button onClick={handleDrawerClose}>{t("common.cancel")}</Button>
                        <Button type="primary" onClick={handleSubmit} loading={actionLoading}>
                            {editingTeam ? t("common.save") : t("common.confirm")}
                        </Button>
                    </Space>
                }
            >
                <Form form={form} layout="vertical" disabled={actionLoading}>
                    <Form.Item
                        name="teamName"
                        label={t("teamManagement.name")}
                        rules={[{required: true, message: t("teamManagement.nameRequired")}]}
                    >
                        <Input placeholder={t("teamManagement.namePlaceholder")} allowClear />
                    </Form.Item>
                    <Form.Item name="description" label={t("teamManagement.description")}>
                        <TextArea
                            placeholder={t("teamManagement.descriptionPlaceholder")}
                            rows={4}
                            allowClear
                        />
                    </Form.Item>
                </Form>
            </ResizableDrawer>
        </div>
    );
};

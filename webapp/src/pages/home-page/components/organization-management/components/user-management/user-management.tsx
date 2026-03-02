import React, {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {App, Button, Input, Select, Space, Table, Tag, Tooltip, Typography,} from "antd";
import type {ColumnsType, TablePaginationConfig} from "antd/es/table";
import {EditOutlined, ReloadOutlined, SearchOutlined, UserAddOutlined,} from "@ant-design/icons";
import type {User, UserQueryParams} from "@Webapp/api/modules/user";
import {useUserActions, useUserList} from "@Webapp/api/modules/user";
import {useAllDepartments} from "@Webapp/api/modules/organization/department";
import {useAllTeams} from "@Webapp/api/modules/organization/team";
import {CreateUserDrawer} from "./components/create-user-drawer";
import {EditUserDrawer} from "./components/edit-user-drawer";
import "./user-management.scss";

const {Title} = Typography;

export const UserManagement: React.FC = () => {
    const {t} = useTranslation();
    const {message, modal} = App.useApp();

    // Data hooks
    const {users, loading, pagination, fetchUsers, setPagination} = useUserList();
    const {toggleUserStatus} = useUserActions();
    const {departments, fetchDepartments} = useAllDepartments();
    const {teams, fetchTeams} = useAllTeams();

    // Filter states
    const [keyword, setKeyword] = useState("");
    const [filterDepartmentId, setFilterDepartmentId] = useState<string | undefined>();
    const [filterTeamId, setFilterTeamId] = useState<string | undefined>();
    const [filterStatus, setFilterStatus] = useState<boolean | undefined>();

    // Drawer states
    const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
    const [editDrawerOpen, setEditDrawerOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Build query params
    const buildQueryParams = useCallback(
        (page?: number, pageSize?: number): UserQueryParams => ({
            page: page ?? pagination.page,
            pageSize: pageSize ?? pagination.pageSize,
            keyword: keyword || undefined,
            departmentId: filterDepartmentId || undefined,
            teamId: filterTeamId || undefined,
            isActive: filterStatus,
        }),
        [keyword, filterDepartmentId, filterTeamId, filterStatus, pagination.page, pagination.pageSize]
    );

    // Fetch data on mount
    useEffect(() => {
        fetchDepartments();
        fetchTeams();
    }, [fetchDepartments, fetchTeams]);

    useEffect(() => {
        fetchUsers(buildQueryParams());
    }, [fetchUsers, buildQueryParams]);

    // Handle search
    const handleSearch = useCallback(() => {
        fetchUsers(buildQueryParams(1));
    }, [fetchUsers, buildQueryParams]);

    // Handle reset filters
    const handleReset = useCallback(() => {
        setKeyword("");
        setFilterDepartmentId(undefined);
        setFilterTeamId(undefined);
        setFilterStatus(undefined);
        fetchUsers({page: 1, pageSize: pagination.pageSize});
    }, [fetchUsers, pagination.pageSize]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        fetchUsers(buildQueryParams());
    }, [fetchUsers, buildQueryParams]);

    // Handle pagination change
    const handleTableChange = useCallback(
        (paginationConfig: TablePaginationConfig) => {
            const newPage = paginationConfig.current ?? 1;
            const newPageSize = paginationConfig.pageSize ?? 10;
            setPagination((prev) => ({...prev, page: newPage, pageSize: newPageSize}));
            fetchUsers(buildQueryParams(newPage, newPageSize));
        },
        [fetchUsers, buildQueryParams, setPagination]
    );

    // Handle toggle status
    const handleToggleStatus = useCallback(
        async (user: User) => {
            const newStatus = !user.isActive;
            const action = newStatus
                ? t("userManagement.active")
                : t("userManagement.inactive");

            modal.confirm({
                title: t("userManagement.toggleStatusConfirmTitle"),
                content: t("userManagement.toggleStatusConfirm", {
                    name: user.fullName,
                    action,
                }),
                okText: t("common.confirm"),
                cancelText: t("common.cancel"),
                okType: newStatus ? "primary" : "danger",
                onOk: async () => {
                    try {
                        await toggleUserStatus(user.id, newStatus);
                        message.success(t("userManagement.toggleStatusSuccess"));
                        handleRefresh();
                    } catch (e: unknown) {
                        const err = e as {message?: string};
                        message.error(
                            err?.message || t("userManagement.toggleStatusFailed")
                        );
                    }
                },
            });
        },
        [t, modal, message, toggleUserStatus, handleRefresh]
    );

    // Handle edit
    const handleEdit = useCallback((user: User) => {
        setEditingUser(user);
        setEditDrawerOpen(true);
    }, []);

    // Handle create/edit success
    const handleMutationSuccess = useCallback(() => {
        handleRefresh();
    }, [handleRefresh]);

    // Table columns
    const columns: ColumnsType<User> = React.useMemo(
        () => [
            {
                title: t("userManagement.username"),
                dataIndex: "username",
                key: "username",
                width: 140,
                ellipsis: true,
            },
            {
                title: t("userManagement.fullName"),
                dataIndex: "fullName",
                key: "fullName",
                width: 140,
                ellipsis: true,
            },
            {
                title: t("userManagement.email"),
                dataIndex: "email",
                key: "email",
                width: 200,
                ellipsis: true,
            },
            {
                title: t("userManagement.phone"),
                dataIndex: "phone",
                key: "phone",
                width: 140,
                render: (phone: string) => phone || "-",
            },
            {
                title: t("userManagement.department"),
                dataIndex: "departmentName",
                key: "departmentName",
                width: 140,
                render: (name: string | undefined) => name || "-",
            },
            {
                title: t("userManagement.team"),
                dataIndex: "teamNames",
                key: "teamNames",
                width: 200,
                render: (teamNames: string[]) => {
                    if (!teamNames?.length) return "-";
                    return (
                        <Space size={[0, 4]} wrap>
                            {teamNames.map((name, idx) => (
                                <Tag key={idx}>{name}</Tag>
                            ))}
                        </Space>
                    );
                },
            },
            {
                title: t("userManagement.status"),
                dataIndex: "isActive",
                key: "isActive",
                width: 100,
                render: (isActive: boolean) =>
                    isActive ? (
                        <Tag color="success">{t("userManagement.active")}</Tag>
                    ) : (
                        <Tag color="error">{t("userManagement.inactive")}</Tag>
                    ),
            },
            {
                title: t("userManagement.createDateTime"),
                dataIndex: "createDateTime",
                key: "createDateTime",
                width: 170,
                render: (dt: string) => (dt ? new Date(dt).toLocaleString() : "-"),
            },
            {
                title: t("common.operation"),
                key: "action",
                width: 160,
                fixed: "right",
                render: (_: unknown, record: User) => (
                    <Space size="small">
                        <Tooltip title={t("common.edit")}>
                            <Button
                                type="link"
                                size="small"
                                icon={<EditOutlined/>}
                                onClick={() => handleEdit(record)}
                            />
                        </Tooltip>
                        <Tooltip
                            title={
                                record.isActive
                                    ? t("userManagement.deactivate")
                                    : t("userManagement.activate")
                            }
                        >
                            <Button
                                type="link"
                                size="small"
                                danger={record.isActive}
                                onClick={() => handleToggleStatus(record)}
                            >
                                {record.isActive
                                    ? t("userManagement.deactivate")
                                    : t("userManagement.activate")}
                            </Button>
                        </Tooltip>
                    </Space>
                ),
            },
        ],
        [t, handleEdit, handleToggleStatus]
    );

    return (
        <div className="user-management">
            <div className="user-management-header">
                <Title level={4}>{t("userManagement.title")}</Title>
                <Button
                    type="primary"
                    icon={<UserAddOutlined/>}
                    onClick={() => setCreateDrawerOpen(true)}
                >
                    {t("userManagement.createUser")}
                </Button>
            </div>

            <div className="user-management-filters">
                <Space wrap size="middle">
                    <Input
                        placeholder={t("userManagement.searchPlaceholder")}
                        prefix={<SearchOutlined/>}
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onPressEnter={handleSearch}
                        allowClear
                        style={{width: 240}}
                    />
                    <Select
                        placeholder={t("userManagement.filterDepartment")}
                        value={filterDepartmentId}
                        onChange={setFilterDepartmentId}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        style={{width: 180}}
                        options={departments.map((d) => ({
                            value: d.id,
                            label: d.departmentName,
                        }))}
                    />
                    <Select
                        placeholder={t("userManagement.filterTeam")}
                        value={filterTeamId}
                        onChange={setFilterTeamId}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        style={{width: 180}}
                        options={teams.map((tm) => ({
                            value: tm.id,
                            label: tm.teamName,
                        }))}
                    />
                    <Select
                        placeholder={t("userManagement.filterStatus")}
                        value={filterStatus}
                        onChange={setFilterStatus}
                        allowClear
                        style={{width: 140}}
                        options={[
                            {value: true, label: t("userManagement.active")},
                            {value: false, label: t("userManagement.inactive")},
                        ]}
                    />
                    <Button
                        type="primary"
                        icon={<SearchOutlined/>}
                        onClick={handleSearch}
                    >
                        {t("common.search")}
                    </Button>
                    <Button onClick={handleReset}>{t("common.reset")}</Button>
                    <Tooltip title={t("userManagement.refresh")}>
                        <Button
                            icon={<ReloadOutlined/>}
                            onClick={handleRefresh}
                        />
                    </Tooltip>
                </Space>
            </div>

            <Table<User>
                columns={columns}
                dataSource={users}
                rowKey="id"
                loading={loading}
                scroll={{x: 1300}}
                pagination={{
                    current: pagination.page,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showTotal: (total) => t("userManagement.totalCount", {total}),
                    pageSizeOptions: ["10", "20", "50"],
                }}
                onChange={handleTableChange}
            />

            <CreateUserDrawer
                open={createDrawerOpen}
                departments={departments}
                teams={teams}
                onClose={() => setCreateDrawerOpen(false)}
                onSuccess={handleMutationSuccess}
            />

            <EditUserDrawer
                open={editDrawerOpen}
                user={editingUser}
                departments={departments}
                teams={teams}
                onClose={() => {
                    setEditDrawerOpen(false);
                    setEditingUser(null);
                }}
                onSuccess={handleMutationSuccess}
            />
        </div>
    );
};

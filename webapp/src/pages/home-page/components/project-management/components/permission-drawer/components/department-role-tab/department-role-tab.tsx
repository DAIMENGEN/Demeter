import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Button, Popover, Select, Table, Tag, Popconfirm} from "antd";
import {PlusOutlined, DeleteOutlined} from "@ant-design/icons";
import type {ColumnsType} from "antd/es/table";
import {useTranslation} from "react-i18next";
import type {ProjectDepartmentRole} from "@Webapp/api/modules/project";
import {
    ProjectRole,
    getProjectRoleLabel,
    getProjectRoleOptions,
    useProjectDepartmentRoles,
    useProjectDepartmentRoleActions,
} from "@Webapp/api/modules/project";
import {useAllDepartments} from "@Webapp/api/modules/organization/department";

interface DepartmentRoleTabProps {
    projectId: string;
    open: boolean;
    canManage: boolean;
    currentUserRole?: string;
}

const roleStringToNumber = (role?: string): number => {
    const map: Record<string, number> = {
        owner: ProjectRole.OWNER,
        admin: ProjectRole.ADMIN,
        maintainer: ProjectRole.MAINTAINER,
        member: ProjectRole.MEMBER,
        viewer: ProjectRole.VIEWER,
    };
    return role ? (map[role] ?? ProjectRole.VIEWER) : ProjectRole.VIEWER;
};

export const DepartmentRoleTab: React.FC<DepartmentRoleTabProps> = ({
    projectId,
    open,
    canManage,
    currentUserRole,
}) => {
    const {t} = useTranslation();
    const {departmentRoles, loading, fetchDepartmentRoles} = useProjectDepartmentRoles();
    const {addDepartmentRoles, updateDepartmentRole, removeDepartmentRole, loading: actionLoading} = useProjectDepartmentRoleActions();
    const {departments, fetchDepartments} = useAllDepartments();

    const [popoverOpen, setPopoverOpen] = useState(false);
    const [selectedDeptId, setSelectedDeptId] = useState<string>();
    const [selectedRole, setSelectedRole] = useState<number>(ProjectRole.MEMBER);

    useEffect(() => {
        if (open) {
            fetchDepartmentRoles(projectId);
        }
    }, [open, projectId, fetchDepartmentRoles]);

    useEffect(() => {
        if (popoverOpen) {
            fetchDepartments();
        }
    }, [popoverOpen, fetchDepartments]);

    const currentRoleNum = roleStringToNumber(currentUserRole);

    const assignableRoleOptions = useMemo(() => {
        return getProjectRoleOptions(t).filter(
            (opt) => opt.value > currentRoleNum && opt.value !== ProjectRole.OWNER
        );
    }, [t, currentRoleNum]);

    /** 过滤掉已添加的部门 */
    const availableDeptOptions = useMemo(() => {
        const existingIds = new Set(departmentRoles.map((r) => r.departmentId));
        return departments
            .filter((dept) => !existingIds.has(dept.id))
            .map((dept) => ({label: dept.departmentName, value: dept.id}));
    }, [departments, departmentRoles]);

    const handleAdd = useCallback(async () => {
        if (!selectedDeptId) return;
        await addDepartmentRoles(projectId, {
            departmentRoles: [{departmentId: selectedDeptId, role: selectedRole}],
        });
        setPopoverOpen(false);
        setSelectedDeptId(undefined);
        setSelectedRole(ProjectRole.MEMBER);
        fetchDepartmentRoles(projectId);
    }, [projectId, selectedDeptId, selectedRole, addDepartmentRoles, fetchDepartmentRoles]);

    const handleRoleChange = useCallback(async (departmentId: string, role: number) => {
        await updateDepartmentRole(projectId, departmentId, {role});
        fetchDepartmentRoles(projectId);
    }, [projectId, updateDepartmentRole, fetchDepartmentRoles]);

    const handleRemove = useCallback(async (departmentId: string) => {
        await removeDepartmentRole(projectId, departmentId);
        fetchDepartmentRoles(projectId);
    }, [projectId, removeDepartmentRole, fetchDepartmentRoles]);

    const columns: ColumnsType<ProjectDepartmentRole> = useMemo(() => [
        {
            title: t("permission.departmentName"),
            key: "departmentName",
            dataIndex: "departmentName",
        },
        {
            title: t("permission.role"),
            key: "role",
            width: 150,
            render: (_, record) => {
                if (!canManage) {
                    return <Tag>{getProjectRoleLabel(record.role as ProjectRole, t)}</Tag>;
                }
                return (
                    <Select
                        size="small"
                        value={record.role}
                        options={assignableRoleOptions}
                        onChange={(val) => handleRoleChange(record.departmentId, val)}
                        style={{width: 120}}
                        loading={actionLoading}
                    />
                );
            },
        },
        {
            title: t("permission.joinedAt"),
            key: "createDateTime",
            dataIndex: "createDateTime",
            width: 160,
            render: (val: string) => val ? new Date(val).toLocaleDateString() : "-",
        },
        ...(canManage
            ? [
                  {
                      title: t("permission.actions"),
                      key: "actions",
                      width: 80,
                      render: (_: unknown, record: ProjectDepartmentRole) => (
                          <Popconfirm
                              title={t("permission.removeConfirm")}
                              onConfirm={() => handleRemove(record.departmentId)}
                              okText={t("common.confirm")}
                              cancelText={t("common.cancel")}
                          >
                              <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<DeleteOutlined />}
                              />
                          </Popconfirm>
                      ),
                  } as ColumnsType<ProjectDepartmentRole>[number],
              ]
            : []),
    ], [t, canManage, assignableRoleOptions, handleRoleChange, handleRemove, actionLoading]);

    const popoverContent = (
        <div className="add-popover-content">
            <div className="popover-field">
                <span className="popover-label">{t("permission.selectDepartment")}</span>
                <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder={t("permission.searchDepartmentPlaceholder")}
                    options={availableDeptOptions}
                    value={selectedDeptId}
                    onChange={setSelectedDeptId}
                    style={{width: "100%"}}
                    notFoundContent={t("common.noData")}
                />
            </div>
            <div className="popover-field">
                <span className="popover-label">{t("permission.role")}</span>
                <Select
                    value={selectedRole}
                    options={assignableRoleOptions}
                    onChange={setSelectedRole}
                    style={{width: "100%"}}
                />
            </div>
            <div className="popover-actions">
                <Button size="small" onClick={() => setPopoverOpen(false)}>
                    {t("common.cancel")}
                </Button>
                <Button
                    type="primary"
                    size="small"
                    onClick={handleAdd}
                    loading={actionLoading}
                    disabled={!selectedDeptId}
                >
                    {t("common.confirm")}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="permission-tab">
            {canManage && (
                <div className="tab-toolbar">
                    <Popover
                        trigger="click"
                        placement="bottomRight"
                        open={popoverOpen}
                        onOpenChange={setPopoverOpen}
                        content={popoverContent}
                    >
                        <Button type="primary" size="small" icon={<PlusOutlined />}>
                            {t("permission.addDepartment")}
                        </Button>
                    </Popover>
                </div>
            )}
            <Table<ProjectDepartmentRole>
                rowKey="id"
                columns={columns}
                dataSource={departmentRoles}
                loading={loading}
                pagination={false}
                size="small"
            />
        </div>
    );
};

import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Button, Popover, Select, Table, Tag, Popconfirm} from "antd";
import {PlusOutlined, DeleteOutlined} from "@ant-design/icons";
import type {ColumnsType} from "antd/es/table";
import {useTranslation} from "react-i18next";
import type {ProjectMember} from "@Webapp/api/modules/project";
import {
    ProjectRole,
    getProjectRoleLabel,
    getProjectRoleOptions,
    useProjectMembers,
    useProjectMemberActions,
} from "@Webapp/api/modules/project";
import {useUserSelectOptions} from "@Webapp/api/modules/user";
import {useDebouncedUserSearch} from
    "@Webapp/pages/home-page/components/project-management/components/project-detail/components/schedulant-toolbar/hooks/use-debounced-user-search";

interface MemberTabProps {
    projectId: string;
    open: boolean;
    canManage: boolean;
    currentUserRole?: string;
}

/** 将后端返回的角色字符串转为数值 */
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

export const MemberTab: React.FC<MemberTabProps> = ({
    projectId,
    open,
    canManage,
    currentUserRole,
}) => {
    const {t} = useTranslation();
    const {members, loading, fetchMembers} = useProjectMembers();
    const {addMembers, updateMemberRole, removeMember, loading: actionLoading} = useProjectMemberActions();

    const [popoverOpen, setPopoverOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>();
    const [selectedRole, setSelectedRole] = useState<number>(ProjectRole.MEMBER);

    const userPicker = useUserSelectOptions({perPage: 20, activeOnly: true});
    const {onUserSearch, resetUserSearch} = useDebouncedUserSearch({
        open: popoverOpen,
        search: userPicker.search,
    });

    useEffect(() => {
        if (open) {
            fetchMembers(projectId);
        }
    }, [open, projectId, fetchMembers]);

    const currentRoleNum = roleStringToNumber(currentUserRole);

    /** 不可分配比自己更高的角色，且不允许分配 Owner */
    const assignableRoleOptions = useMemo(() => {
        return getProjectRoleOptions(t).filter(
            (opt) => opt.value > currentRoleNum && opt.value !== ProjectRole.OWNER
        );
    }, [t, currentRoleNum]);

    const handleAdd = useCallback(async () => {
        if (!selectedUserId) return;
        await addMembers(projectId, {
            members: [{userId: selectedUserId, role: selectedRole}],
        });
        setPopoverOpen(false);
        setSelectedUserId(undefined);
        setSelectedRole(ProjectRole.MEMBER);
        resetUserSearch();
        fetchMembers(projectId);
    }, [projectId, selectedUserId, selectedRole, addMembers, fetchMembers, resetUserSearch]);

    const handleRoleChange = useCallback(async (userId: string, role: number) => {
        await updateMemberRole(projectId, userId, {role});
        fetchMembers(projectId);
    }, [projectId, updateMemberRole, fetchMembers]);

    const handleRemove = useCallback(async (userId: string) => {
        await removeMember(projectId, userId);
        fetchMembers(projectId);
    }, [projectId, removeMember, fetchMembers]);

    const columns: ColumnsType<ProjectMember> = useMemo(() => [
        {
            title: t("permission.name"),
            key: "name",
            render: (_, record) => (
                <span>
                    {record.fullName || record.username}
                    {record.fullName && record.username && (
                        <span style={{color: "#8c8c8c", marginLeft: 4}}>({record.username})</span>
                    )}
                </span>
            ),
        },
        {
            title: t("permission.role"),
            key: "role",
            width: 150,
            render: (_, record) => {
                if (record.role === ProjectRole.OWNER || !canManage) {
                    return (
                        <Tag color={record.role === ProjectRole.OWNER ? "gold" : undefined}>
                            {getProjectRoleLabel(record.role as ProjectRole, t)}
                        </Tag>
                    );
                }
                return (
                    <Select
                        size="small"
                        value={record.role}
                        options={assignableRoleOptions}
                        onChange={(val) => handleRoleChange(record.userId, val)}
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
                      render: (_: unknown, record: ProjectMember) => {
                          if (record.role === ProjectRole.OWNER) return null;
                          return (
                              <Popconfirm
                                  title={t("permission.removeConfirm")}
                                  onConfirm={() => handleRemove(record.userId)}
                                  okText={t("common.confirm")}
                                  cancelText={t("common.cancel")}
                              >
                                  <Button
                                      type="text"
                                      danger
                                      icon={<DeleteOutlined />}
                                  />
                              </Popconfirm>
                          );
                      },
                  } as ColumnsType<ProjectMember>[number],
              ]
            : []),
    ], [t, canManage, assignableRoleOptions, handleRoleChange, handleRemove, actionLoading]);

    const popoverContent = (
        <div className="add-popover-content">
            <div className="popover-field">
                <span className="popover-label">{t("permission.selectUser")}</span>
                <Select
                    showSearch={{
                        filterOption: false,
                        onSearch: onUserSearch,
                    }}
                    placeholder={t("permission.searchUserPlaceholder")}
                    options={userPicker.options}
                    loading={userPicker.loading}
                    value={selectedUserId}
                    onChange={setSelectedUserId}
                    onFocus={() => {
                        if (userPicker.options.length === 0) onUserSearch("");
                    }}
                    onPopupScroll={(e) => {
                        const target = e.target as HTMLDivElement;
                        if (target.scrollHeight - target.scrollTop - target.clientHeight < 24) {
                            userPicker.loadMore();
                        }
                    }}
                    style={{width: "100%"}}
                    notFoundContent={userPicker.loading ? t("common.loading") : t("common.noData")}
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
                <Button onClick={() => setPopoverOpen(false)}>
                    {t("common.cancel")}
                </Button>
                <Button
                    type="primary"
                    onClick={handleAdd}
                    loading={actionLoading}
                    disabled={!selectedUserId}
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
                        getPopupContainer={(trigger) => trigger.closest(".ant-drawer-body") || document.body}
                    >
                        <Button type="primary" icon={<PlusOutlined />}>
                            {t("permission.addMember")}
                        </Button>
                    </Popover>
                </div>
            )}
            <Table<ProjectMember>
                rowKey="id"
                columns={columns}
                dataSource={members}
                loading={loading}
                pagination={false}
                size="small"
            />
        </div>
    );
};

import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Button, Popover, Select, Table, Tag, Popconfirm} from "antd";
import {PlusOutlined, DeleteOutlined} from "@ant-design/icons";
import type {ColumnsType} from "antd/es/table";
import {useTranslation} from "react-i18next";
import type {ProjectTeamRole} from "@Webapp/api/modules/project";
import {
    ProjectRole,
    getProjectRoleLabel,
    getProjectRoleOptions,
    useProjectTeamRoles,
    useProjectTeamRoleActions,
} from "@Webapp/api/modules/project";
import {useAllTeams} from "@Webapp/api/modules/organization/team";

interface TeamRoleTabProps {
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

export const TeamRoleTab: React.FC<TeamRoleTabProps> = ({
    projectId,
    open,
    canManage,
    currentUserRole,
}) => {
    const {t} = useTranslation();
    const {teamRoles, loading, fetchTeamRoles} = useProjectTeamRoles();
    const {addTeamRoles, updateTeamRole, removeTeamRole, loading: actionLoading} = useProjectTeamRoleActions();
    const {teams, fetchTeams} = useAllTeams();

    const [popoverOpen, setPopoverOpen] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<string>();
    const [selectedRole, setSelectedRole] = useState<number>(ProjectRole.MEMBER);

    useEffect(() => {
        if (open) {
            fetchTeamRoles(projectId);
        }
    }, [open, projectId, fetchTeamRoles]);

    useEffect(() => {
        if (popoverOpen) {
            fetchTeams();
        }
    }, [popoverOpen, fetchTeams]);

    const currentRoleNum = roleStringToNumber(currentUserRole);

    const assignableRoleOptions = useMemo(() => {
        return getProjectRoleOptions(t).filter(
            (opt) => opt.value > currentRoleNum && opt.value !== ProjectRole.OWNER
        );
    }, [t, currentRoleNum]);

    /** 过滤掉已添加的团队 */
    const availableTeamOptions = useMemo(() => {
        const existingIds = new Set(teamRoles.map((r) => r.teamId));
        return teams
            .filter((team) => !existingIds.has(team.id))
            .map((team) => ({label: team.teamName, value: team.id}));
    }, [teams, teamRoles]);

    const handleAdd = useCallback(async () => {
        if (!selectedTeamId) return;
        await addTeamRoles(projectId, {
            teamRoles: [{teamId: selectedTeamId, role: selectedRole}],
        });
        setPopoverOpen(false);
        setSelectedTeamId(undefined);
        setSelectedRole(ProjectRole.MEMBER);
        fetchTeamRoles(projectId);
    }, [projectId, selectedTeamId, selectedRole, addTeamRoles, fetchTeamRoles]);

    const handleRoleChange = useCallback(async (teamId: string, role: number) => {
        await updateTeamRole(projectId, teamId, {role});
        fetchTeamRoles(projectId);
    }, [projectId, updateTeamRole, fetchTeamRoles]);

    const handleRemove = useCallback(async (teamId: string) => {
        await removeTeamRole(projectId, teamId);
        fetchTeamRoles(projectId);
    }, [projectId, removeTeamRole, fetchTeamRoles]);

    const columns: ColumnsType<ProjectTeamRole> = useMemo(() => [
        {
            title: t("permission.teamName"),
            key: "teamName",
            dataIndex: "teamName",
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
                        onChange={(val) => handleRoleChange(record.teamId, val)}
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
                      render: (_: unknown, record: ProjectTeamRole) => (
                          <Popconfirm
                              title={t("permission.removeConfirm")}
                              onConfirm={() => handleRemove(record.teamId)}
                              okText={t("common.confirm")}
                              cancelText={t("common.cancel")}
                          >
                              <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                              />
                          </Popconfirm>
                      ),
                  } as ColumnsType<ProjectTeamRole>[number],
              ]
            : []),
    ], [t, canManage, assignableRoleOptions, handleRoleChange, handleRemove, actionLoading]);

    const popoverContent = (
        <div className="add-popover-content">
            <div className="popover-field">
                <span className="popover-label">{t("permission.selectTeam")}</span>
                <Select
                    showSearch={{optionFilterProp: "label"}}
                    placeholder={t("permission.searchTeamPlaceholder")}
                    options={availableTeamOptions}
                    value={selectedTeamId}
                    onChange={setSelectedTeamId}
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
                <Button onClick={() => setPopoverOpen(false)}>
                    {t("common.cancel")}
                </Button>
                <Button
                    type="primary"
                    onClick={handleAdd}
                    loading={actionLoading}
                    disabled={!selectedTeamId}
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
                        <Button type="primary" icon={<PlusOutlined />}>
                            {t("permission.addTeam")}
                        </Button>
                    </Popover>
                </div>
            )}
            <Table<ProjectTeamRole>
                rowKey="id"
                columns={columns}
                dataSource={teamRoles}
                loading={loading}
                pagination={false}
                size="small"
            />
        </div>
    );
};

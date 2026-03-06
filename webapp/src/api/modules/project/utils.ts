import type {TFunction} from "i18next";
import {ProjectRole, ProjectStatus, ProjectVisibility} from "./types";

/**
 * 获取项目状态的国际化标签
 */
export const getProjectStatusLabel = (status: ProjectStatus, t: TFunction): string => {
    const statusLabelMap: Record<ProjectStatus, string> = {
        [ProjectStatus.PLANNING]: t("project.statusPlanning"),
        [ProjectStatus.IN_PROGRESS]: t("project.statusInProgress"),
        [ProjectStatus.PAUSED]: t("project.statusPaused"),
        [ProjectStatus.COMPLETED]: t("project.statusCompleted"),
        [ProjectStatus.CANCELLED]: t("project.statusCancelled"),
    };
    return statusLabelMap[status] || "";
};

/**
 * 获取项目状态选项列表（用于下拉框）
 */
export const getProjectStatusOptions = (t: TFunction) => {
    return Object.values(ProjectStatus).map((value) => ({
        label: getProjectStatusLabel(value, t),
        value: value,
    }));
};

/**
 * 获取项目角色的国际化标签
 */
export const getProjectRoleLabel = (role: ProjectRole, t: TFunction): string => {
    const roleLabelMap: Record<ProjectRole, string> = {
        [ProjectRole.OWNER]: t("project.roleOwner"),
        [ProjectRole.ADMIN]: t("project.roleAdmin"),
        [ProjectRole.MAINTAINER]: t("project.roleMaintainer"),
        [ProjectRole.MEMBER]: t("project.roleMember"),
        [ProjectRole.VIEWER]: t("project.roleViewer"),
    };
    return roleLabelMap[role] || "";
};

/**
 * 获取项目角色选项列表（用于下拉框）
 */
export const getProjectRoleOptions = (t: TFunction) => {
    return Object.values(ProjectRole).map((value) => ({
        label: getProjectRoleLabel(value, t),
        value: value,
    }));
};

/**
 * 获取项目可见性的国际化标签
 */
export const getProjectVisibilityLabel = (visibility: ProjectVisibility, t: TFunction): string => {
    const visibilityLabelMap: Record<ProjectVisibility, string> = {
        [ProjectVisibility.PRIVATE]: t("project.visibilityPrivate"),
        [ProjectVisibility.INTERNAL]: t("project.visibilityInternal"),
        [ProjectVisibility.PUBLIC]: t("project.visibilityPublic"),
    };
    return visibilityLabelMap[visibility] || "";
};

/**
 * 获取项目可见性选项列表（用于下拉框）
 */
export const getProjectVisibilityOptions = (t: TFunction) => {
    return Object.values(ProjectVisibility).map((value) => ({
        label: getProjectVisibilityLabel(value, t),
        value: value,
    }));
};


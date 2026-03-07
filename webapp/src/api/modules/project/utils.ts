import type {TFunction} from "i18next";
import {
    ProjectRole,
    ProjectRoleLabelKeys,
    ProjectStatus,
    ProjectStatusLabelKeys,
    ProjectVisibility,
    ProjectVisibilityLabelKeys,
} from "./types";

/**
 * 获取项目状态的国际化标签
 */
export const getProjectStatusLabel = (status: ProjectStatus, t: TFunction): string => {
    const key = ProjectStatusLabelKeys[status];
    return key ? t(key) : "";
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
    const key = ProjectRoleLabelKeys[role];
    return key ? t(key) : "";
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
    const key = ProjectVisibilityLabelKeys[visibility];
    return key ? t(key) : "";
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


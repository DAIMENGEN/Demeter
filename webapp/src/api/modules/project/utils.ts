import type {TFunction} from "i18next";
import {ProjectStatus} from "./types";

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


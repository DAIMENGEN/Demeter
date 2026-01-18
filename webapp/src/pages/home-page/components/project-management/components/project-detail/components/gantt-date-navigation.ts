import type {Dayjs} from "dayjs";
import type {ViewType} from "./gantt-view.ts";

export type ViewStep = {
    amount: number;
    unit: "day" | "week" | "month" | "year";
};

export const getViewStep = (viewType: ViewType): ViewStep => {
    switch (viewType) {
        case "Day":
            return {amount: 1, unit: "day"};
        case "Week":
            return {amount: 1, unit: "week"};
        case "Month":
            return {amount: 1, unit: "month"};
        case "Quarter":
            // Use months to avoid dayjs typing friction around 'quarter'.
            return {amount: 3, unit: "month"};
        case "Year":
            return {amount: 1, unit: "year"};
        default:
            return {amount: 1, unit: "day"};
    }
};

export const shiftRangeByViewStep = (start: Dayjs, end: Dayjs, viewType: ViewType, direction: -1 | 1) => {
    const step = getViewStep(viewType);
    const amount = step.amount * direction;

    return {
        start: start.add(amount, step.unit),
        end: end.add(amount, step.unit),
    };
};


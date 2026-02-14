import type {Dayjs} from "dayjs";

export const toNaiveDateTimeString = (date: Dayjs): string => date.format("YYYY-MM-DDTHH:mm:ss");



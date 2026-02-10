import type {Dayjs} from "dayjs";

export const toNaiveDateTimeString = (date: Dayjs): string => date.format("YYYY-MM-DDTHH:mm:ss");

export const parseOptionalNonNegativeInteger = (raw: unknown): number | undefined => {
    if (raw === undefined || raw === null || raw === "") return undefined;

    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n)) return undefined;

    const int = Math.trunc(n);
    return int >= 0 ? int : undefined;
};



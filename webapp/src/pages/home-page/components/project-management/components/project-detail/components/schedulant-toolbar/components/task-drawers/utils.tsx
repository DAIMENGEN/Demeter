import React from "react";
import {DatePicker, Form, Input, InputNumber, Select, Space, Typography} from "antd";
import dayjs, {type Dayjs} from "dayjs";
import type {TFunction} from "i18next";
import {
    ProjectTaskAttributeTypeLabelKeys,
    type JsonValue,
    type ProjectTaskAttributeConfig,
    ProjectTaskType,
    TaskTypeLabelKeys
} from "@Webapp/api/modules/project";

const {Text} = Typography;

type SelectOption = { label: string; value: string };

export type CustomAttributeFormValue = JsonValue | Dayjs;

export interface TaskDrawerFormValues {
    taskName: string;
    parentId?: string;
    order: number;
    dateRange?: [Dayjs, Dayjs];
    taskType: number;
    customAttributes?: Record<string, CustomAttributeFormValue>;
}

/* ------------------------------------------------------------------ */
/*  Date formatting                                                    */
/* ------------------------------------------------------------------ */

export const toNaiveDateTimeString = (date: Dayjs): string => date.format("YYYY-MM-DDTHH:mm:ss");

/* ------------------------------------------------------------------ */
/*  Attribute helpers                                                  */
/* ------------------------------------------------------------------ */

export const buildAttributeTypeMap = (attributeConfigs: ProjectTaskAttributeConfig[]) => {
    const map = new Map<string, string>();
    for (const cfg of attributeConfigs) {
        if (cfg.attributeName) map.set(cfg.attributeName, cfg.attributeType);
    }
    return map;
};

export const buildTaskTypeOptions = (t: TFunction) => {
    return [ProjectTaskType.UNKNOWN, ProjectTaskType.DEFAULT, ProjectTaskType.MILESTONE, ProjectTaskType.CHECKPOINT].map((v) => ({
        value: v,
        label: t(TaskTypeLabelKeys[v])
    }));
};

/* ------------------------------------------------------------------ */
/*  Select / user option helpers (shared between form & preview)       */
/* ------------------------------------------------------------------ */

const toSelectOptions = (raw: JsonValue | undefined): SelectOption[] => {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((x) => {
            if (typeof x === "string" || typeof x === "number" || typeof x === "boolean") {
                const v = String(x);
                return {label: v, value: v};
            }
            if (x && typeof x === "object" && !Array.isArray(x)) {
                const rec = x as Record<string, JsonValue>;
                const l = rec.label;
                const v = rec.value;
                if (
                    typeof l === "string" &&
                    (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
                ) {
                    return {label: l, value: String(v)};
                }
            }
            return null;
        })
        .filter((x): x is SelectOption => Boolean(x));
};

export const toScalarString = (v: JsonValue | undefined): string | null => {
    if (v == null) return null;
    if (typeof v === "string") {
        const s = v.trim();
        return s ? s : null;
    }
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    return null;
};

export const toUserIdFromJson = (raw: JsonValue | undefined): string | null => {
    if (raw == null) return null;
    if (typeof raw === "string") return raw.trim() || null;
    if (typeof raw === "number") return String(raw);
    return null;
};

export const buildSelectValueLabelMap = (options: JsonValue | undefined): ReadonlyMap<string, string> => {
    const m = new Map<string, string>();
    const opts = toSelectOptions(options);
    for (const o of opts) {
        m.set(o.value, o.label);
    }
    return m;
};

export const buildUserValueLabelMap = (options: JsonValue | undefined): ReadonlyMap<string, string> => {
    return buildSelectValueLabelMap(options);
};

/* ------------------------------------------------------------------ */
/*  Normalize form values -> API payload                               */
/* ------------------------------------------------------------------ */

const toStringValue = (v: CustomAttributeFormValue): string | null => {
    if (v == null) return null;
    if (typeof v === "string") {
        const s = v.trim();
        return s ? s : null;
    }
    if (typeof v === "number" || typeof v === "boolean") return String(v);

    if (typeof v === "object" && !Array.isArray(v)) {
        const maybeDayjs = v as unknown as { format?: (fmt: string) => string };
        if (typeof maybeDayjs.format === "function") {
            return maybeDayjs.format("YYYY-MM-DDTHH:mm:ss");
        }
    }

    return null;
};

export const normalizeCustomAttributesToStrings = (
    raw: Record<string, CustomAttributeFormValue> | undefined,
    attributeTypeMap: Map<string, string>
): Record<string, JsonValue> => {
    const out: Record<string, JsonValue> = {};

    for (const [key, value] of Object.entries(raw ?? {})) {
        const type = attributeTypeMap.get(key) ?? "text";

        if (value == null) {
            out[key] = null;
            continue;
        }

        if (type === "date") {
            if (typeof value === "object" && !Array.isArray(value)) {
                const maybeDayjs = value as unknown as {
                    isValid?: () => boolean;
                    format?: (fmt: string) => string;
                };
                if (
                    typeof maybeDayjs.isValid === "function" &&
                    typeof maybeDayjs.format === "function" &&
                    maybeDayjs.isValid()
                ) {
                    out[key] = maybeDayjs.format("YYYY-MM-DD");
                    continue;
                }
            }
            if (typeof value === "string") {
                const s = value.trim();
                out[key] = s ? s : null;
                continue;
            }
            out[key] = toStringValue(value);
            continue;
        }

        if (type === "datetime") {
            if (typeof value === "object" && !Array.isArray(value)) {
                const maybeDayjs = value as unknown as {
                    isValid?: () => boolean;
                    format?: (fmt: string) => string;
                };
                if (
                    typeof maybeDayjs.isValid === "function" &&
                    typeof maybeDayjs.format === "function" &&
                    maybeDayjs.isValid()
                ) {
                    out[key] = maybeDayjs.format("YYYY-MM-DDTHH:mm:ss");
                    continue;
                }
            }
            if (typeof value === "string") {
                const s = value.trim();
                out[key] = s ? s : null;
                continue;
            }
            out[key] = toStringValue(value);
            continue;
        }

        out[key] = toStringValue(value);
    }

    for (const k of Object.keys(out)) {
        if (out[k] == null) delete out[k];
    }

    return out;
};

/* ------------------------------------------------------------------ */
/*  Map server custom attributes -> form values                        */
/* ------------------------------------------------------------------ */

export const mapServerCustomAttrsToForm = (
    raw: Record<string, JsonValue> | undefined,
    attributeTypeMap: Map<string, string>
): Record<string, CustomAttributeFormValue> => {
    const formCustom: Record<string, CustomAttributeFormValue> = {};

    for (const [key, value] of Object.entries(raw ?? {})) {
        if (value == null) continue;
        const type = attributeTypeMap.get(key) ?? "text";

        if (type === "date" || type === "datetime") {
            if (typeof value === "string") {
                const d = dayjs(value);
                formCustom[key] = d.isValid() ? d : value;
            } else {
                formCustom[key] = value;
            }
        } else {
            formCustom[key] = value;
        }
    }

    return formCustom;
};

/* ------------------------------------------------------------------ */
/*  Build default custom attrs from configs                            */
/* ------------------------------------------------------------------ */

export const buildDefaultCustomAttrsFromConfigs = (
    configs: ProjectTaskAttributeConfig[]
): Record<string, CustomAttributeFormValue> => {
    const defaults: Record<string, CustomAttributeFormValue> = {};

    for (const cfg of configs) {
        const key = cfg.attributeName;
        if (!key) continue;
        if (cfg.defaultValue == null || cfg.defaultValue === "") continue;

        if (cfg.attributeType === "date" || cfg.attributeType === "datetime") {
            const d = dayjs(cfg.defaultValue);
            defaults[key] = d.isValid() ? d : null;
        } else {
            defaults[key] = cfg.defaultValue;
        }
    }

    return defaults;
};

/* ------------------------------------------------------------------ */
/*  Render dynamic custom-attribute form items                         */
/* ------------------------------------------------------------------ */

export const renderCustomAttributeItems = (
    attributeConfigs: ProjectTaskAttributeConfig[],
    t: TFunction
) => {
    return attributeConfigs
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((cfg) => {
            const name = cfg.attributeName;
            if (!name) return null;

            const label = (
                <Space size={6}>
                    <span>{cfg.attributeLabel || cfg.attributeName}</span>
                    <Text type="secondary" style={{fontSize: 12}}>
                        ({t(
                            ProjectTaskAttributeTypeLabelKeys[
                                (cfg.attributeType as keyof typeof ProjectTaskAttributeTypeLabelKeys) ?? "text"
                            ] ?? cfg.attributeType
                        )})
                    </Text>
                </Space>
            );

            const rules = cfg.isRequired
                ? [{required: true as const, message: `${cfg.attributeLabel || cfg.attributeName}`}]
                : undefined;

            switch (cfg.attributeType) {
                case "number":
                    return (
                        <Form.Item key={cfg.id} label={label} name={["customAttributes", name]} rules={rules}>
                            <InputNumber style={{width: "100%"}} placeholder={t("task.inputNumber")}/>
                        </Form.Item>
                    );
                case "boolean":
                    return (
                        <Form.Item key={cfg.id} label={label} name={["customAttributes", name]} rules={rules}>
                            <Select
                                placeholder={t("task.selectPlaceholder")}
                                allowClear
                                options={[
                                    {label: t("task.selectYes"), value: "true"},
                                    {label: t("task.selectNo"), value: "false"}
                                ]}
                            />
                        </Form.Item>
                    );
                case "date":
                    return (
                        <Form.Item key={cfg.id} label={label} name={["customAttributes", name]} rules={rules}>
                            <DatePicker style={{width: "100%"}}/>
                        </Form.Item>
                    );
                case "datetime":
                    return (
                        <Form.Item key={cfg.id} label={label} name={["customAttributes", name]} rules={rules}>
                            <DatePicker showTime style={{width: "100%"}}/>
                        </Form.Item>
                    );
                case "select": {
                    const opts = toSelectOptions(cfg.options ?? undefined);
                    return (
                        <Form.Item key={cfg.id} label={label} name={["customAttributes", name]} rules={rules}>
                            <Select placeholder={t("task.selectPlaceholder")} allowClear options={opts}/>
                        </Form.Item>
                    );
                }
                case "user": {
                    const opts = toSelectOptions(cfg.options ?? undefined);
                    return (
                        <Form.Item key={cfg.id} label={label} name={["customAttributes", name]} rules={rules}>
                            <Select
                                placeholder={t("task.selectUser")}
                                allowClear
                                showSearch={{
                                    optionFilterProp: "label"
                                }}
                                options={opts}
                            />
                        </Form.Item>
                    );
                }
                case "text":
                default:
                    return (
                        <Form.Item key={cfg.id} label={label} name={["customAttributes", name]} rules={rules}>
                            <Input placeholder={t("task.inputPlaceholder")} allowClear/>
                        </Form.Item>
                    );
            }
        })
        .filter((x): x is React.ReactElement => Boolean(x));
};

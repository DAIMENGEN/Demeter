import React from "react";
import {useTranslation} from "react-i18next";
import {Button, Form, type FormInstance, Select, type SelectProps, Space} from "antd";

import type {SelectOptionRow} from "../types.ts";

type UserPicker = {
    options: { label: string; value: string }[];
    loading: boolean;
    loadMore: () => void | Promise<void>;
};

type LabelValue = NonNullable<SelectProps["value"]> extends infer V
    ? V extends { value: infer VV; label?: React.ReactNode }
        ? { value: Extract<VV, string>; label?: React.ReactNode }
        : never
    : never;

export const UserField: React.FC<{
    form: FormInstance;
    userPicker: UserPicker;
    onUserSearch: (kw: string) => void;
    resetUserSearch: () => void;
}> = ({userPicker, onUserSearch, resetUserSearch}) => {
    const {t} = useTranslation();
    return (
        <>
            <Form.Item
                label={t("attributeConfig.userOptions")}
                extra={t("attributeConfig.userOptionsExtra")}
            >
                <Form.List name="optionsRows">
                    {(fields, {add, remove}) => (
                        <Space orientation="vertical" style={{width: "100%"}} size="small">
                            {fields.map((field) => {
                                const {key, ...fieldProps} = field;
                                return (
                                    <Space key={key} style={{display: "flex"}} align="baseline">
                                        <Form.Item noStyle>
                                            <Space.Compact>
                                                <Form.Item
                                                    {...fieldProps}
                                                    name={[field.name, "value"]}
                                                    rules={[{required: true, message: t("attributeConfig.userRequired")}]}
                                                    style={{marginBottom: 0, minWidth: 320}}>
                                                    <Select
                                                        labelInValue
                                                        showSearch={{
                                                            filterOption: false,
                                                            onSearch: onUserSearch
                                                        }}
                                                        allowClear
                                                        placeholder={t("attributeConfig.searchUser")}
                                                        options={userPicker.options}
                                                        loading={userPicker.loading}
                                                        onFocus={() => {
                                                            if (!userPicker.options.length) onUserSearch("");
                                                        }}
                                                        onClear={() => {
                                                            resetUserSearch();
                                                            onUserSearch("");
                                                        }}
                                                        onPopupScroll={(e) => {
                                                            const target = e.target as HTMLElement | null;
                                                            if (!target) return;
                                                            const nearBottom =
                                                                target.scrollTop + target.clientHeight >= target.scrollHeight - 24;
                                                            if (nearBottom) void userPicker.loadMore();
                                                        }}
                                                        notFoundContent={userPicker.loading ? t("common.loading") : t("common.noData")}
                                                        onChange={() => {
                                                            resetUserSearch();
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Space.Compact>
                                        </Form.Item>

                                        <Button danger onClick={() => remove(field.name)}>
                                            {t("common.delete")}
                                        </Button>
                                    </Space>
                                );
                            })}

                            <Button
                                type="dashed"
                                onClick={() => add({value: null as unknown as LabelValue})}>
                                {t("attributeConfig.addUser")}
                            </Button>
                        </Space>
                    )}
                </Form.List>
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.optionsRows !== cur.optionsRows}>
                {({getFieldValue}) => {
                    const optionsRows = (getFieldValue("optionsRows") as SelectOptionRow[] | undefined) ?? [];
                    const validOptions = optionsRows
                        .map((r) => {
                            const raw = r?.value;
                            if (!raw || typeof raw === "string") return null;
                            return {value: raw.value, label: raw.label};
                        })
                        .filter((x): x is { value: string; label: string } => Boolean(x));

                    return (
                        <Form.Item
                            name="defaultUser"
                            label={t("attributeConfig.defaultUser")}
                            extra={t("attributeConfig.defaultUserExtra")}
                        >
                            <Select
                                labelInValue
                                allowClear
                                placeholder={t("attributeConfig.defaultUserPlaceholder")}
                                options={validOptions}
                                notFoundContent={t("attributeConfig.noUsersHint")}
                            />
                        </Form.Item>
                    );
                }}
            </Form.Item>
        </>
    );
};

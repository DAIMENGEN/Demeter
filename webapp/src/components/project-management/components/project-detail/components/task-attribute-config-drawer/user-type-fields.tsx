import React from "react";
import {Button, Form, type FormInstance, Input, Select, type SelectProps, Space} from "antd";

import type {SelectOptionRow} from "./types";

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

export const UserTypeFields: React.FC<{
    form: FormInstance;
    userPicker: UserPicker;
    onUserSearch: (kw: string) => void;
    resetUserSearch: () => void;
}> = ({form, userPicker, onUserSearch, resetUserSearch}) => {
    return (
        <>
            <Form.Item
                label="可选人员（限制范围）"
                extra="用于 user(人员) 类型。这里配置的是可选人员列表（白名单）。默认人员也只能从这里选择。"
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
                                                    rules={[{required: true, message: "请选择人员"}]}
                                                    style={{marginBottom: 0, minWidth: 320}}
                                                    getValueFromEvent={(v: LabelValue | null) => {
                                                        form.setFieldValue(["optionsRows", field.name, "label"], v?.label ?? "");
                                                        return v;
                                                    }}>
                                                    <Select
                                                        labelInValue
                                                        showSearch={{
                                                            filterOption: false,
                                                            onSearch: onUserSearch
                                                        }}
                                                        allowClear
                                                        placeholder="搜索并选择人员"
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
                                                        notFoundContent={userPicker.loading ? "加载中..." : "暂无数据"}
                                                        onChange={() => {
                                                            // 选中后重置搜索状态，提升连续添加体验
                                                            resetUserSearch();
                                                        }}
                                                    />
                                                </Form.Item>

                                                {/* 存储 label 用于显示（与 value 同步写入） */}
                                                <Form.Item
                                                    {...fieldProps}
                                                    name={[field.name, "label"]}
                                                    rules={[{required: true, message: "缺少 label"}]}
                                                    style={{marginBottom: 0}}
                                                    hidden>
                                                    <Input/>
                                                </Form.Item>
                                            </Space.Compact>
                                        </Form.Item>

                                        <Button danger onClick={() => remove(field.name)}>
                                            删除
                                        </Button>
                                    </Space>
                                );
                            })}

                            <Button
                                type="dashed"
                                onClick={() => add({label: "", value: null as unknown as LabelValue})}
                            >
                                添加人员
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
                            const id = typeof raw === "string" ? raw : raw?.value;
                            const label = r?.label;
                            if (!id || !label) return null;
                            return {value: id, label};
                        })
                        .filter((x): x is { value: string; label: string } => Boolean(x));

                    return (
                        <Form.Item
                            name="defaultUser"
                            label="默认人员"
                            extra="存储的是 userId。默认人员必须在上面【可选人员】里。"
                        >
                            <Select
                                labelInValue
                                allowClear
                                placeholder="选择默认人员（可选）"
                                options={validOptions}
                                notFoundContent="请先添加可选人员"
                            />
                        </Form.Item>
                    );
                }}
            </Form.Item>
        </>
    );
};

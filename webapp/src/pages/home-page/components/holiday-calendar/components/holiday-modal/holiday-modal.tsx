import React, {useEffect, useRef} from "react";
import {Form, Input, message, Modal, Select, Space, Tag} from "antd";
import dayjs from "dayjs";
import {holidayApi} from "@Webapp/api";
import type {CreateHolidayParams, Holiday} from "@Webapp/api/modules/holiday/types";
import type { InputRef } from "antd";
import {log} from "@Webapp/logging";

const {TextArea} = Input;

interface HolidayModalProps {
    visible: boolean;
    dates: string[];
    editingHoliday: Holiday | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const HolidayModal: React.FC<HolidayModalProps> = ({
                                                              visible,
                                                              dates,
                                                              editingHoliday,
                                                              onClose,
                                                              onSuccess,
                                                          }) => {
     const [form] = Form.useForm();
     const nameInputRef = useRef<InputRef>(null);

     const focusNameInput = () => {
         // 等 Modal 动画/FocusTrap 建立完成后再聚焦，避免首次打开时焦点落到 close button
         requestAnimationFrame(() => {
             nameInputRef.current?.focus({ preventScroll: true });
         });
     };

     // Set form values when modal opens or editingHoliday changes
     // Note: dates is only used for display and doesn't affect form initialization
     // form instance is stable and doesn't need to be in dependencies
     useEffect(() => {
         if (visible) {
             if (editingHoliday) {
                 // Edit mode
                 form.setFieldsValue({
                     holidayName: editingHoliday.holidayName,
                     description: editingHoliday.description,
                     holidayType: editingHoliday.holidayType,
                 });
             } else {
                 // Add mode - reset to defaults
                 form.setFieldsValue({
                     holidayName: undefined,
                     description: undefined,
                     holidayType: 1, // Default to legal holiday
                 });
             }
         } else {
             // Reset form when modal closes
             form.resetFields();
         }
     }, [visible, editingHoliday, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (editingHoliday) {
                // Update existing holiday
                await holidayApi.updateHoliday(editingHoliday.id, {
                    holidayName: values.holidayName,
                    description: values.description,
                    holidayDate: dates[0],
                    holidayType: values.holidayType,
                });
                message.success("更新成功");
            } else {
                // Create new holiday(s)
                if (dates.length === 1) {
                    // Single date
                    await holidayApi.createHoliday({
                        holidayName: values.holidayName,
                        description: values.description,
                        holidayDate: dates[0],
                        holidayType: values.holidayType,
                    });
                    message.success("添加成功");
                } else {
                    // Multiple dates (batch)
                    const holidays: CreateHolidayParams[] = dates.map(date => ({
                        holidayName: values.holidayName,
                        description: values.description,
                        holidayDate: date,
                        holidayType: values.holidayType,
                    }));
                    await holidayApi.batchCreateHolidays({holidays});
                    message.success(`批量添加成功 (${dates.length}个)`);
                }
            }
            onSuccess();
        } catch (error) {
            // Log error for debugging
            log.error("Failed to submit holiday:", error);

            // Show user-friendly error message
            const errorMessage = error instanceof Error ? error.message : "操作失败";
            message.error(errorMessage);
        }
    };
    const getTitle = () => {
        if (editingHoliday) {
            return "编辑";
        }
        return dates.length > 1 ? `批量添加 (${dates.length}个日期)` : "添加";
    };
    return (
        <Modal
            title={getTitle()}
            open={visible}
            afterOpenChange={(opened) => {
                if (opened) focusNameInput();
            }}
            onOk={handleSubmit}
            onCancel={onClose}
            okText="确定"
            cancelText="取消"
            width={500}
            className="holiday-modal"
            forceRender
        >
            <Form
                form={form}
                layout="vertical">
                <Form.Item
                    name="holidayName"
                    label="名称"
                    rules={[{required: true, message: "请输入名称"}]}
                >
                    <Input ref={nameInputRef} placeholder="例如：国庆节、春节、调休补班"/>
                </Form.Item>
                <Form.Item
                    name="holidayType"
                    label="类型"
                    rules={[{required: true, message: "请选择类型"}]}
                >
                    <Select
                        options={[
                            {value: 1, label: "法定假期"},
                            {value: 2, label: "公司假期"},
                            {value: 3, label: "调休上班"},
                        ]}
                    />
                </Form.Item>
                <Form.Item label={dates.length > 1 ? "选中的日期" : "日期"}>
                    <Space size={[8, 8]} wrap>
                        {dates.slice(0, 10).map((date, index) => (
                            <Tag key={index} color="blue">
                                {dayjs(date).format("YYYY-MM-DD")}
                            </Tag>
                        ))}
                        {dates.length > 10 && (
                            <Tag color="default">
                                ...还有 {dates.length - 10} 个
                            </Tag>
                        )}
                    </Space>
                </Form.Item>
                <Form.Item name="description" label="描述（可选）">
                    <TextArea
                        rows={3}
                        placeholder="添加一些备注信息"
                        maxLength={200}
                        showCount
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

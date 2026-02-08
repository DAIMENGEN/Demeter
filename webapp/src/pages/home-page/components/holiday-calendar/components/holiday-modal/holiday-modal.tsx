import React, {useEffect, useRef} from "react";
import {App, Form, Input, Modal, Select, Space, Tag} from "antd";
import dayjs from "dayjs";
import {useTranslation} from "react-i18next";
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
     const {t} = useTranslation();
     const [form] = Form.useForm();
     const nameInputRef = useRef<InputRef>(null);
     const {message} = App.useApp();

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
                message.success(t("holiday.updateSuccess"));
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
                    message.success(t("holiday.createSuccess"));
                } else {
                    // Multiple dates (batch)
                    const holidays: CreateHolidayParams[] = dates.map(date => ({
                        holidayName: values.holidayName,
                        description: values.description,
                        holidayDate: date,
                        holidayType: values.holidayType,
                    }));
                    await holidayApi.batchCreateHolidays({holidays});
                    message.success(t("holiday.batchCreateSuccess", {count: dates.length}));
                }
            }
            onSuccess();
        } catch (error) {
            // Log error for debugging
            log.error("Failed to submit holiday:", error);

            // Show user-friendly error message
            const errorMessage = error instanceof Error
                ? error.message
                : (editingHoliday ? t("holiday.updateFailed") : t("holiday.createFailed"));
            message.error(errorMessage);
        }
    };
    const getTitle = () => {
        if (editingHoliday) {
            return t("holiday.editHoliday");
        }
        return dates.length > 1 ? t("holiday.batchAdd", {count: dates.length}) : t("holiday.addHoliday");
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
            okText={t("common.confirm")}
            cancelText={t("common.cancel")}
            width={500}
            className="holiday-modal"
            forceRender
        >
            <Form
                form={form}
                layout="vertical">
                <Form.Item
                    name="holidayName"
                    label={t("holiday.name")}
                    rules={[{required: true, message: t("holiday.nameRequired")}]}
                >
                    <Input ref={nameInputRef} placeholder={t("holiday.namePlaceholder")}/>
                </Form.Item>
                <Form.Item
                    name="holidayType"
                    label={t("holiday.type")}
                    rules={[{required: true, message: t("holiday.typeRequired")}]}
                >
                    <Select
                        options={[
                            {value: 1, label: t("holiday.typeLegal")},
                            {value: 2, label: t("holiday.typeCompany")},
                            {value: 3, label: t("holiday.typeWorkday")},
                        ]}
                    />
                </Form.Item>
                <Form.Item label={dates.length > 1 ? t("holiday.selectedDates") : t("holiday.date")}>
                    <Space size={[8, 8]} wrap>
                        {dates.slice(0, 10).map((date, index) => (
                            <Tag key={index} color="blue">
                                {dayjs(date).format("YYYY-MM-DD")}
                            </Tag>
                        ))}
                        {dates.length > 10 && (
                            <Tag color="default">
                                {t("holiday.moreCount", {count: dates.length - 10})}
                            </Tag>
                        )}
                    </Space>
                </Form.Item>
                <Form.Item name="description" label={t("holiday.description")}>
                    <TextArea
                        rows={3}
                        placeholder={t("holiday.descriptionPlaceholder")}
                        maxLength={200}
                        showCount
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

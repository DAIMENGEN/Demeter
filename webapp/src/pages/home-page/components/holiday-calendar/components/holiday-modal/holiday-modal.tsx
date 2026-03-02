import React, {useEffect, useRef} from "react";
import type {InputRef} from "antd";
import {App, Form, Input, Modal, Select, Space, Tag} from "antd";
import dayjs from "@Webapp/config/dayjs";
import {useTranslation} from "react-i18next";
import {holidayApi} from "@Webapp/api";
import type {CreateHolidayParams, Holiday} from "@Webapp/api/modules/holiday/types";
import {log} from "@Webapp/logging";

const {TextArea} = Input;

interface HolidayModalProps {
    visible: boolean;
    dates: string[];
    editingHoliday: Holiday | null;
    editingHolidays: Holiday[];
    onClose: () => void;
    onSuccess: () => void;
}

export const HolidayModal: React.FC<HolidayModalProps> = ({
                                                              visible,
                                                              dates,
                                                              editingHoliday,
                                                              editingHolidays,
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

     // Determine mode
     const isBatchEdit = editingHolidays.length > 0;

     // Compute display dates: for batch edit, derive from holidays; otherwise use dates prop
     const displayDates = isBatchEdit
         ? editingHolidays.map(h => h.holidayDate).sort()
         : dates;

     // Set form values when modal opens or editingHoliday changes
     // Note: dates is only used for display and doesn't affect form initialization
     // form instance is stable and doesn't need to be in dependencies
     useEffect(() => {
         if (visible) {
             if (isBatchEdit) {
                 // Batch edit mode - pre-fill with common values if all holidays share the same value
                 const allSameName = editingHolidays.every(h => h.holidayName === editingHolidays[0].holidayName);
                 const allSameType = editingHolidays.every(h => h.holidayType === editingHolidays[0].holidayType);
                 const allSameDesc = editingHolidays.every(h => h.description === editingHolidays[0].description);
                 form.setFieldsValue({
                     holidayName: allSameName ? editingHolidays[0].holidayName : undefined,
                     description: allSameDesc ? editingHolidays[0].description : undefined,
                     holidayType: allSameType ? editingHolidays[0].holidayType : undefined,
                 });
             } else if (editingHoliday) {
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
     }, [visible, editingHoliday, editingHolidays, isBatchEdit, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (isBatchEdit) {
                // Batch update existing holidays
                await holidayApi.batchUpdateHolidays({
                    ids: editingHolidays.map(h => h.id),
                    holidayName: values.holidayName,
                    description: values.description,
                    holidayType: values.holidayType,
                });
                message.success(t("holiday.batchUpdateSuccess", {count: editingHolidays.length}));
            } else if (editingHoliday) {
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
                : (editingHoliday || isBatchEdit ? t("holiday.updateFailed") : t("holiday.createFailed"));
            message.error(errorMessage);
        }
    };
    const getTitle = () => {
        if (isBatchEdit) {
            return t("holiday.batchEdit", {count: editingHolidays.length});
        }
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
                <Form.Item label={displayDates.length > 1 ? t("holiday.selectedDates") : t("holiday.date")}>
                    <Space size={[8, 8]} wrap>
                        {displayDates.slice(0, 10).map((date, index) => (
                            <Tag key={index} color="blue">
                                {dayjs(date).format("YYYY-MM-DD")}
                            </Tag>
                        ))}
                        {displayDates.length > 10 && (
                            <Tag color="default">
                                {t("holiday.moreCount", {count: displayDates.length - 10})}
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

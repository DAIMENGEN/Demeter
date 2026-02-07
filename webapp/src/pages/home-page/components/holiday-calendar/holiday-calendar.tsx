import "./holiday-calendar.scss";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Button, message, Select, Space, Spin, Typography} from "antd";
import {LeftOutlined, RightOutlined} from "@ant-design/icons";
import dayjs from "dayjs";
import {holidayApi} from "@Webapp/api";
import {assertApiOk} from "@Webapp/api/common/response.ts";
import type {Holiday} from "@Webapp/api/modules/holiday/types";
import {YearCalendar} from "./components/year-calendar";
import {HolidayModal} from "./components/holiday-modal";
import {log} from "@Webapp/logging";

const {Title} = Typography;

export const HolidayCalendar: React.FC = () => {
    const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);

    // Generate year options (current year and past 4 years)
    const yearOptions = useMemo(() => {
        const currentYear = dayjs().year();
        const years = [];
        for (let i = currentYear - 4; i <= currentYear; i++) {
            years.push({value: i, label: `${i}年`});
        }
        return years;
    }, []);

    // Load holidays for selected year
    const loadHolidays = useCallback(async () => {
        setLoading(true);
        try {
            const startDate = `${selectedYear}-01-01`;
            const endDate = `${selectedYear}-12-31`;
            const response = await holidayApi.getAllHolidays({startDate, endDate});
            setHolidays(assertApiOk(response));
        } catch (error) {
            log.error("Failed to load holidays:", error);
            const errorMessage = error instanceof Error ? error.message : "加载假期数据失败";
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => {
        loadHolidays().catch(error => {
            log.error("Failed to load holidays in useEffect:", error);
        });
    }, [loadHolidays]);

    const handleYearChange = (year: number) => {
        setSelectedYear(year);
    };

    const handlePreviousYear = () => {
        setSelectedYear(prev => prev - 1);
    };

    const handleNextYear = () => {
        setSelectedYear(prev => prev + 1);
    };

    const handleDateClick = (date: string, holiday?: Holiday) => {
        if (holiday) {
            // Edit existing holiday
            setEditingHoliday(holiday);
            setSelectedDates([date]);
            setModalVisible(true);
        } else {
            // Add new holiday
            setEditingHoliday(null);
            setSelectedDates([date]);
            setModalVisible(true);
        }
    };

    const handleBatchAdd = (dates: string[]) => {
        setEditingHoliday(null);
        setSelectedDates(dates);
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        setEditingHoliday(null);
        setSelectedDates([]);
    };

    const handleModalSuccess = () => {
        setModalVisible(false);
        setEditingHoliday(null);
        setSelectedDates([]);
        loadHolidays().catch(error => {
            log.error("Failed to reload holidays after modal success:", error);
            message.error("刷新假期数据失败");
        });
    };

    const handleDelete = async (holidayId: string) => {
        try {
            await holidayApi.deleteHoliday(holidayId);
            message.success("删除成功");
            loadHolidays().catch(error => {
                log.error("Failed to reload holidays after delete:", error);
                message.error("刷新假期数据失败");
            });
        } catch (error) {
            log.error("Failed to delete holiday:", error);
            const errorMessage = error instanceof Error ? error.message : "删除失败";
            message.error(errorMessage);
        }
    };

    return (
        <div className="holiday-calendar">
            <div className="holiday-calendar__header">
                <Title level={2}>假期管理</Title>
                <Space size="large" className="holiday-calendar__controls">
                    <Space>
                        <Button
                            icon={<LeftOutlined/>}
                            onClick={handlePreviousYear}
                            type="default"
                        />
                        <Select
                            value={selectedYear}
                            onChange={handleYearChange}
                            options={yearOptions}
                            style={{width: 120}}
                        />
                        <Button
                            icon={<RightOutlined/>}
                            onClick={handleNextYear}
                            type="default"
                            disabled={selectedYear >= dayjs().year()}
                        />
                    </Space>
                </Space>
            </div>

            <div className="holiday-calendar__content">
                <Spin spinning={loading} wrapperClassName="holiday-calendar__spin">
                    <YearCalendar
                        year={selectedYear}
                        holidays={holidays}
                        onDateClick={handleDateClick}
                        onBatchAdd={handleBatchAdd}
                        onDelete={handleDelete}
                    />
                </Spin>
            </div>

            <HolidayModal visible={modalVisible}
                          dates={selectedDates}
                          editingHoliday={editingHoliday}
                          onClose={handleModalClose}
                          onSuccess={handleModalSuccess}/>
        </div>
    );
};


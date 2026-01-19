import "./holiday-page.scss";
import React, { useState, useEffect, useMemo } from "react";
import { Typography, Select, Space, Spin, message, Button } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { holidayApi } from "@Webapp/api";
import { assertApiOk } from "@Webapp/api/common/response.ts";
import type { Holiday } from "@Webapp/api/modules/holiday/types";
import { YearCalendar } from "./components/year-calendar";
import { HolidayModal } from "./components/holiday-modal";

const { Title } = Typography;

export const HolidayPage: React.FC = () => {
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
      years.push({ value: i, label: `${i}年` });
    }
    return years;
  }, []);

  // Load holidays for selected year
  const loadHolidays = async () => {
    setLoading(true);
    try {
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;
      const response = await holidayApi.getAllHolidays({ startDate, endDate });
      setHolidays(assertApiOk(response));
    } catch (error) {
      message.error("加载假期数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHolidays();
  }, [selectedYear]);

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
    void loadHolidays();
  };

  const handleDelete = async (holidayId: string) => {
    try {
      await holidayApi.deleteHoliday(holidayId);
      message.success("删除成功");
      void loadHolidays();
    } catch (error) {
      message.error("删除失败");
    }
  };

  return (
    <div className="holiday-page">
      <div className="holiday-page__header">
        <Title level={2}>假期管理</Title>
        <Space size="large" className="holiday-page__controls">
          <Space>
            <Button
              icon={<LeftOutlined />}
              onClick={handlePreviousYear}
              type="default"
            />
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              options={yearOptions}
              style={{ width: 120 }}
            />
            <Button
              icon={<RightOutlined />}
              onClick={handleNextYear}
              type="default"
              disabled={selectedYear >= dayjs().year()}
            />
          </Space>
        </Space>
      </div>

      <div className="holiday-page__content">
        <Spin spinning={loading} wrapperClassName="holiday-page__spin">
          <YearCalendar
            year={selectedYear}
            holidays={holidays}
            onDateClick={handleDateClick}
            onBatchAdd={handleBatchAdd}
            onDelete={handleDelete}
          />
        </Spin>
      </div>

      <HolidayModal
        visible={modalVisible}
        dates={selectedDates}
        editingHoliday={editingHoliday}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};


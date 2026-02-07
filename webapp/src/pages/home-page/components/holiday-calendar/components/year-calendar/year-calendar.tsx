import "./year-calendar.scss";
import React, { useState, useMemo } from "react";
import { Popconfirm, Tooltip, Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Holiday } from "@Webapp/api/modules/holiday/types";

interface YearCalendarProps {
  year: number;
  holidays: Holiday[];
  onDateClick: (date: string, holiday?: Holiday) => void;
  onBatchAdd: (dates: string[]) => void;
  onDelete: (holidayId: string) => void;
}

interface DayInfo {
  date: string;
  dayOfMonth: number;
  isWeekend: boolean;
  isHoliday: boolean;
  holiday?: Holiday;
  isToday: boolean;
}

// Helper function to generate tooltip content for holidays
const getTooltipContent = (holiday: Holiday) => {
  if (holiday.description) {
    return (
      <div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{holiday.holidayName}</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{holiday.description}</div>
      </div>
    );
  }
  return holiday.holidayName;
};

// Component to render individual day content
interface DayContentProps {
  dayInfo: DayInfo;
  isSelecting: boolean;
  onDelete: (holidayId: string) => void;
}

const DayContent: React.FC<DayContentProps> = React.memo(({ dayInfo, isSelecting, onDelete }) => {
  if (dayInfo.isHoliday && dayInfo.holiday) {
    const handleConfirm = (e: React.MouseEvent<HTMLElement> | undefined) => {
      if (e) {
        e.stopPropagation();
      }
      onDelete(dayInfo.holiday!.id);
    };

    const handleCancel = (e: React.MouseEvent<HTMLElement> | undefined) => {
      if (e) {
        e.stopPropagation();
      }
    };

    const handleDeleteClick = (e: React.MouseEvent<HTMLSpanElement>) => {
      e.stopPropagation();
    };

    return (
      <Tooltip title={getTooltipContent(dayInfo.holiday)}>
        <div className="year-calendar__day-content">
          <span className="year-calendar__day-number">{dayInfo.dayOfMonth}</span>
          {!isSelecting && (
            <Popconfirm
              title="确定删除此假期？"
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              okText="删除"
              cancelText="取消"
            >
              <DeleteOutlined
                className="year-calendar__day-delete"
                onClick={handleDeleteClick}
              />
            </Popconfirm>
          )}
        </div>
      </Tooltip>
    );
  }

  return <span className="year-calendar__day-number">{dayInfo.dayOfMonth}</span>;
});

export const YearCalendar: React.FC<YearCalendarProps> = ({
  year,
  holidays,
  onDateClick,
  onBatchAdd,
  onDelete,
}) => {
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  // Create a map for quick holiday lookup
  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday>();
    holidays.forEach(holiday => {
      map.set(holiday.holidayDate, holiday);
    });
    return map;
  }, [holidays]);

  // Generate calendar data for all 12 months
  const monthsData = useMemo(() => {
    const months = [];
    for (let month = 0; month < 12; month++) {
      const firstDay = dayjs().year(year).month(month).startOf("month");
      const daysInMonth = firstDay.daysInMonth();
      const startWeekday = firstDay.day(); // 0 = Sunday, 6 = Saturday

      const days: (DayInfo | null)[] = [];

      // Add empty cells for days before month starts
      for (let i = 0; i < startWeekday; i++) {
        days.push(null);
      }

      // Add all days in month
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = dayjs()
          .year(year)
          .month(month)
          .date(day);
        const dateStr = currentDate.format("YYYY-MM-DD");
        const weekday = currentDate.day();
        const holiday = holidayMap.get(dateStr);

        days.push({
          date: dateStr,
          dayOfMonth: day,
          isWeekend: weekday === 0 || weekday === 6,
          isHoliday: !!holiday,
          holiday,
          isToday: currentDate.isSame(dayjs(), "day"),
        });
      }

      months.push({
        month,
        monthName: firstDay.format("M月"),
        days,
      });
    }
    return months;
  }, [year, holidayMap]);

  const handleDayClick = (dayInfo: DayInfo) => {
    if (isSelecting) {
      // Batch selection mode
      const newSelected = new Set(selectedDates);
      if (newSelected.has(dayInfo.date)) {
        newSelected.delete(dayInfo.date);
      } else {
        newSelected.add(dayInfo.date);
      }
      setSelectedDates(newSelected);
    } else {
      // Single selection mode
      onDateClick(dayInfo.date, dayInfo.holiday);
    }
  };

  const handleToggleSelectionMode = () => {
    if (isSelecting && selectedDates.size > 0) {
      // Confirm batch add
      onBatchAdd(Array.from(selectedDates));
      setSelectedDates(new Set());
    }
    setIsSelecting(!isSelecting);
  };

  const handleCancelSelection = () => {
    setSelectedDates(new Set());
    setIsSelecting(false);
  };

  const getDayClassName = (dayInfo: DayInfo) => {
    const classes = ["year-calendar__day"];

    if (dayInfo.isToday) classes.push("year-calendar__day--today");
    if (dayInfo.isWeekend && !dayInfo.isHoliday) classes.push("year-calendar__day--weekend");
    if (dayInfo.isHoliday) {
      if (dayInfo.holiday?.holidayType === 1) {
        classes.push("year-calendar__day--legal");
      } else if (dayInfo.holiday?.holidayType === 2) {
        classes.push("year-calendar__day--company");
      } else if (dayInfo.holiday?.holidayType === 3) {
        classes.push("year-calendar__day--workday");
      }
    }
    if (selectedDates.has(dayInfo.date)) classes.push("year-calendar__day--selected");

    return classes.join(" ");
  };


  return (
    <div className="year-calendar">
      <div className="year-calendar__toolbar">
        <div className="year-calendar__legend">
          <span className="year-calendar__legend-item">
            <span className="year-calendar__legend-color year-calendar__legend-color--legal"></span>
            法定假期
          </span>
          <span className="year-calendar__legend-item">
            <span className="year-calendar__legend-color year-calendar__legend-color--company"></span>
            公司假期
          </span>
          <span className="year-calendar__legend-item">
            <span className="year-calendar__legend-color year-calendar__legend-color--workday"></span>
            调休上班
          </span>
          <span className="year-calendar__legend-item">
            <span className="year-calendar__legend-color year-calendar__legend-color--weekend"></span>
            周末
          </span>
        </div>
        <div className="year-calendar__actions">
          {isSelecting ? (
            <>
              <Button onClick={handleCancelSelection}>
                取消
              </Button>
              <Button
                type="primary"
                onClick={handleToggleSelectionMode}
                disabled={selectedDates.size === 0}
              >
                批量添加 ({selectedDates.size})
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              onClick={handleToggleSelectionMode}
            >
              批量选择
            </Button>
          )}
        </div>
      </div>

      <div className="year-calendar__grid">
        {monthsData.map(({ month, monthName, days }) => (
          <div key={month} className="year-calendar__month">
            <div className="year-calendar__month-header">{monthName}</div>
            <div className="year-calendar__weekdays">
              {["日", "一", "二", "三", "四", "五", "六"].map((day, index) => (
                <div key={index} className="year-calendar__weekday">
                  {day}
                </div>
              ))}
            </div>
            <div className="year-calendar__days">
              {days.map((dayInfo, index) => (
                <div key={index} className="year-calendar__cell">
                  {dayInfo && (
                    <div
                      className={getDayClassName(dayInfo)}
                      onClick={() => handleDayClick(dayInfo)}
                    >
                      <DayContent
                        dayInfo={dayInfo}
                        isSelecting={isSelecting}
                        onDelete={onDelete}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


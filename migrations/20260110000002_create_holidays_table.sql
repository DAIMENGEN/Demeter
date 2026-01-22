-- 创建假期表
CREATE TABLE IF NOT EXISTS holidays (
    id BIGINT PRIMARY KEY,
    holiday_name VARCHAR(255) NOT NULL,
    description TEXT,
    holiday_date DATE NOT NULL,
    holiday_type INTEGER NOT NULL,
    creator_id BIGINT NOT NULL,
    updater_id BIGINT,
    create_date_time TIMESTAMP NOT NULL DEFAULT '2022-10-08 00:00:00',
    update_date_time TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_holidays_holiday_date ON holidays(holiday_date);
CREATE INDEX idx_holidays_holiday_type ON holidays(holiday_type);
CREATE INDEX idx_holidays_create_date_time ON holidays(create_date_time DESC);

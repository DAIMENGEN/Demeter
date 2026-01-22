-- 创建部门表
CREATE TABLE IF NOT EXISTS departments (
    id BIGINT PRIMARY KEY,
    department_name VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id BIGINT NOT NULL,
    updater_id BIGINT,
    create_date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_date_time TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_departments_department_name ON departments(department_name);
CREATE INDEX idx_departments_creator_id ON departments(creator_id);
CREATE INDEX idx_departments_create_date_time ON departments(create_date_time);


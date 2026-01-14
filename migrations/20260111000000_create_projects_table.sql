-- 创建项目表
CREATE TABLE IF NOT EXISTS projects (
    id BIGINT PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date_time TIMESTAMP NOT NULL,
    end_date_time TIMESTAMP,
    project_status INTEGER NOT NULL,
    version INTEGER,
    "order" DOUBLE PRECISION,
    creator_id BIGINT NOT NULL,
    updater_id BIGINT,
    create_date_time TIMESTAMP NOT NULL DEFAULT '2022-10-08 00:00:00',
    update_date_time TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_projects_project_name ON projects(project_name);
CREATE INDEX idx_projects_project_status ON projects(project_status);
CREATE INDEX idx_projects_start_date_time ON projects(start_date_time);
CREATE INDEX idx_projects_create_date_time ON projects(create_date_time DESC);
CREATE INDEX idx_projects_order ON projects("order");

-- 创建项目访问记录表
CREATE TABLE IF NOT EXISTS project_visits (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    visited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updater_id BIGINT,
    create_date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_date_time TIMESTAMP,
    CONSTRAINT uq_project_visits_user_project UNIQUE (user_id, project_id)
);

-- 创建索引
CREATE INDEX idx_project_visits_user_visited ON project_visits(user_id, visited_at DESC);
CREATE INDEX idx_project_visits_project_id ON project_visits(project_id);

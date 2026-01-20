-- 创建项目任务属性配置表
CREATE TABLE IF NOT EXISTS project_task_attribute_configs (
    id BIGINT PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    attribute_name VARCHAR(255) NOT NULL,
    attribute_label VARCHAR(255) NOT NULL,
    attribute_type VARCHAR(50) NOT NULL, -- text, number, boolean, date, datetime, select
    is_required BOOLEAN NOT NULL DEFAULT false,
    default_value TEXT,
    options JSONB, -- 用于存储 select 类型的选项
    value_color_map JSONB, -- 用于存储属性值的颜色映射，格式: {"值1": "#FF0000", "值2": "#00FF00"}
    "order" DOUBLE PRECISION,
    creator_id BIGINT NOT NULL,
    updater_id BIGINT,
    create_date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_date_time TIMESTAMP,
    UNIQUE(project_id, attribute_name)
);

-- 创建项目任务表
CREATE TABLE IF NOT EXISTS project_tasks (
    id BIGINT PRIMARY KEY,
    task_name VARCHAR(255) NOT NULL,
    parent_id BIGINT REFERENCES project_tasks(id) ON DELETE CASCADE,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    "order" DOUBLE PRECISION NOT NULL,
    start_date_time TIMESTAMP NOT NULL,
    end_date_time TIMESTAMP NOT NULL,
    task_type INT NOT NULL,
    custom_attributes JSONB NOT NULL DEFAULT '{}', -- 存储自定义属性
    creator_id BIGINT NOT NULL,
    updater_id BIGINT,
    create_date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_date_time TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_project_task_attribute_configs_project_id ON project_task_attribute_configs(project_id);
CREATE INDEX idx_project_task_attribute_configs_order ON project_task_attribute_configs("order");

CREATE INDEX idx_project_tasks_task_name ON project_tasks(task_name);
CREATE INDEX idx_project_tasks_parent_id ON project_tasks(parent_id);
CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_order ON project_tasks("order");
CREATE INDEX idx_project_tasks_create_date_time ON project_tasks(create_date_time DESC);
CREATE INDEX idx_project_tasks_custom_attributes ON project_tasks USING GIN (custom_attributes);
CREATE INDEX idx_project_tasks_start_date_time ON project_tasks(start_date_time);
CREATE INDEX idx_project_tasks_end_date_time ON project_tasks(end_date_time);
CREATE INDEX idx_project_tasks_task_type ON project_tasks(task_type);

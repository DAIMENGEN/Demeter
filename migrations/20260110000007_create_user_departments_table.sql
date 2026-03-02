-- 用户-部门 关系表（一个用户最多属于一个部门）
CREATE TABLE IF NOT EXISTS user_departments (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    department_id BIGINT NOT NULL,
    creator_id BIGINT NOT NULL,
    create_date_time TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ud_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ud_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE INDEX idx_ud_user_id ON user_departments(user_id);
CREATE INDEX idx_ud_department_id ON user_departments(department_id);

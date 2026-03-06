-- 项目部门角色表：部门级别的项目角色授权
-- role: 0=owner, 1=admin, 2=maintainer, 3=member, 4=viewer
CREATE TABLE IF NOT EXISTS project_department_roles (
    id BIGINT PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    department_id BIGINT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    role INTEGER NOT NULL DEFAULT 3,
    create_date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_date_time TIMESTAMP,

    UNIQUE(project_id, department_id)
);

CREATE INDEX idx_project_dept_roles_project ON project_department_roles(project_id);
CREATE INDEX idx_project_dept_roles_dept ON project_department_roles(department_id);

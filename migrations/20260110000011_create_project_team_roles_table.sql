-- 项目团队角色表：团队级别的项目角色授权
-- role: 0=owner, 1=admin, 2=maintainer, 3=member, 4=viewer
CREATE TABLE IF NOT EXISTS project_team_roles (
    id BIGINT PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role INTEGER NOT NULL DEFAULT 3,
    create_date_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_date_time TIMESTAMP,

    UNIQUE(project_id, team_id)
);

CREATE INDEX idx_project_team_roles_project ON project_team_roles(project_id);
CREATE INDEX idx_project_team_roles_team ON project_team_roles(team_id);

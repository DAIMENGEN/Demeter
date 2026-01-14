-- 创建团队表
CREATE TABLE IF NOT EXISTS teams (
    id BIGINT PRIMARY KEY,
    team_name VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id BIGINT NOT NULL,
    updater_id BIGINT,
    create_date_time TIMESTAMP NOT NULL DEFAULT '2022-10-08 00:00:00',
    update_date_time TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_teams_team_name ON teams(team_name);
CREATE INDEX idx_teams_creator_id ON teams(creator_id);
CREATE INDEX idx_teams_create_date_time ON teams(create_date_time);

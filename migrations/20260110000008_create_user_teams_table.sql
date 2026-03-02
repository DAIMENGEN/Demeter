-- 用户-团队 关系表（一个用户可以属于多个团队）
CREATE TABLE IF NOT EXISTS user_teams (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    team_id BIGINT NOT NULL,
    creator_id BIGINT NOT NULL,
    create_date_time TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_ut_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ut_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT uq_ut_user_team UNIQUE (user_id, team_id)
);

CREATE INDEX idx_ut_user_id ON user_teams(user_id);
CREATE INDEX idx_ut_team_id ON user_teams(team_id);

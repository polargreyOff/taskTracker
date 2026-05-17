CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(100) NOT NULL UNIQUE,
    name          VARCHAR(100) NOT NULL,
    surname       VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Sessions (custom, see also connect-pg-simple "session" table) ──────────
CREATE TABLE IF NOT EXISTS sessions (
    id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT      NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Teams ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID         REFERENCES users(id) ON DELETE SET NULL,
    name       VARCHAR(100) NOT NULL
);

-- ── Team profiles (заказчики + разработчики, привязанные к команде) ────────
CREATE TABLE IF NOT EXISTS team_profiles (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id        UUID         REFERENCES teams(id) ON DELETE SET NULL,
    specialization VARCHAR(100)
);

-- ── Templates ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS templates (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(200) NOT NULL,
    classification VARCHAR(30),
    area           VARCHAR(30),
    min_confidence FLOAT,
    description    TEXT
);

-- ── Template tasks (задачи-заготовки внутри шаблона) ──────────────────────
CREATE TABLE IF NOT EXISTS template_tasks (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id      UUID         NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    default_priority VARCHAR(20),
    development      VARCHAR(30)
);

-- ── Requests (запросы заказчиков) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS requests (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id    UUID         REFERENCES templates(id) ON DELETE SET NULL,
    team_id        UUID         REFERENCES teams(id) ON DELETE SET NULL,
    classification VARCHAR(30),
    area           VARCHAR(200),
    name           VARCHAR(200),
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Request answers (ответы на опросник) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS requests_answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id      UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    question_number INT  NOT NULL,
    answer_text     TEXT
);

-- ── Tasks (сгенерированные и созданные вручную задачи) ────────────────────
CREATE TABLE IF NOT EXISTS tasks (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id  UUID         REFERENCES requests(id) ON DELETE SET NULL,
    assignee_id UUID         REFERENCES users(id)    ON DELETE SET NULL,
    team_id     UUID         REFERENCES teams(id)    ON DELETE SET NULL,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    status      VARCHAR(20)  NOT NULL DEFAULT 'todo',
    priority    VARCHAR(20)  NOT NULL DEFAULT 'medium',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    development VARCHAR(30)
);

-- Recoflow database schema
-- Runs automatically on first postgres container start via docker-entrypoint-initdb.d

-- ── Events ──────────────────────────────────────────────────────────────────
-- Append-only log of raw user interaction events.
CREATE TABLE IF NOT EXISTS events (
  id         BIGSERIAL    PRIMARY KEY,
  type       VARCHAR(20)  NOT NULL CHECK (type IN ('click', 'view', 'purchase')),
  user_id    VARCHAR(255) NOT NULL,
  item_id    VARCHAR(255) NOT NULL,
  ts         TIMESTAMPTZ  NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events (user_id);
CREATE INDEX IF NOT EXISTS idx_events_item_id ON events (item_id);
CREATE INDEX IF NOT EXISTS idx_events_ts      ON events (ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_type    ON events (type);

-- ── User features (online store) ────────────────────────────────────────────
-- Mirrors the Redis counters; useful for batch reads and auditing.
CREATE TABLE IF NOT EXISTS user_features (
  user_id           VARCHAR(255) PRIMARY KEY,
  interaction_count BIGINT       NOT NULL DEFAULT 0,
  last_active_at    TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Item features (online store) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS item_features (
  item_id          VARCHAR(255) PRIMARY KEY,
  popularity_count BIGINT       NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Model registry ──────────────────────────────────────────────────────────
-- Tracks trained model versions and their promotion status.
CREATE TABLE IF NOT EXISTS model_registry (
  id           BIGSERIAL    PRIMARY KEY,
  model_name   VARCHAR(100) NOT NULL,
  version      VARCHAR(50)  NOT NULL,
  artifact_uri TEXT,
  metrics      JSONB,
  status       VARCHAR(20)  NOT NULL DEFAULT 'staging'
               CHECK (status IN ('staging', 'production', 'archived')),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (model_name, version)
);

CREATE INDEX IF NOT EXISTS idx_model_registry_status ON model_registry (model_name, status);

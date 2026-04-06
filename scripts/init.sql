-- Events (append-only)
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  item_id VARCHAR(50) NOT NULL,
  ts TIMESTAMP NOT NULL
);

CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_item ON events(item_id);
CREATE INDEX idx_events_ts ON events(ts);

-- User Features
CREATE TABLE IF NOT EXISTS user_features (
  user_id VARCHAR(50) PRIMARY KEY,
  last_active TIMESTAMP,
  interaction_count INT DEFAULT 0
);

-- Item Features
CREATE TABLE IF NOT EXISTS item_features (
  item_id VARCHAR(50) PRIMARY KEY,
  popularity_score FLOAT DEFAULT 0
);
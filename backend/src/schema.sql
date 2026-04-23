CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'viewer',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  raw TEXT NOT NULL,
  event_type VARCHAR(100),
  timestamp TIMESTAMP,
  ip_address VARCHAR(45),
  username VARCHAR(100),
  severity VARCHAR(20),
  source VARCHAR(100),
  parsed JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT,
  source_ip VARCHAR(45),
  username VARCHAR(100),
  log_count INTEGER,
  acknowledged BOOLEAN DEFAULT FALSE,
  resolved BOOLEAN DEFAULT FALSE,
  detected_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_heartbeats (
  id SERIAL PRIMARY KEY,
  source VARCHAR(100) UNIQUE NOT NULL,  -- machine name
  hostname VARCHAR(100),
  platform VARCHAR(20),
  last_seen TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'online'   -- online / offline
);

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

-- Error logging table for monitoring and debugging
CREATE TABLE IF NOT EXISTS error_logs (
  id VARCHAR(50) PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  method VARCHAR(10),
  url TEXT,
  user_id INTEGER REFERENCES users(id),
  error_name VARCHAR(100),
  error_message TEXT,
  stack_trace TEXT,
  ip_address VARCHAR(45),
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Account lockout tracking table
CREATE TABLE IF NOT EXISTS account_lockouts (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45),
  failed_attempts INTEGER DEFAULT 1,
  locked_until TIMESTAMP,
  last_attempt TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit trail table for security events
CREATE TABLE IF NOT EXISTS audit_trail (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  username VARCHAR(100),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  resource_id VARCHAR(100),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success',
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Performance Indexes for logs table (most queried)
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_severity ON logs (severity);
CREATE INDEX IF NOT EXISTS idx_logs_event_type ON logs (event_type);
CREATE INDEX IF NOT EXISTS idx_logs_ip_address ON logs (ip_address);
CREATE INDEX IF NOT EXISTS idx_logs_username ON logs (username);
CREATE INDEX IF NOT EXISTS idx_logs_source ON logs (source);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_logs_severity_timestamp ON logs (severity, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_ip_timestamp ON logs (ip_address, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_username_timestamp ON logs (username, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_source_timestamp ON logs (source, timestamp DESC);

-- JSONB indexes for parsed data queries
CREATE INDEX IF NOT EXISTS idx_logs_parsed_gin ON logs USING GIN (parsed);
CREATE INDEX IF NOT EXISTS idx_logs_parsed_btree ON logs USING BTREE ((parsed->>'event_type'));

-- Indexes for alerts table
CREATE INDEX IF NOT EXISTS idx_alerts_detected_at ON alerts (detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts (severity);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts (type);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts (resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts (acknowledged);

-- Composite indexes for alerts
CREATE INDEX IF NOT EXISTS idx_alerts_resolved_severity ON alerts (resolved, severity);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved_detected_at ON alerts (resolved, detected_at DESC);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active);

-- Indexes for agent_heartbeats
CREATE INDEX IF NOT EXISTS idx_agent_heartbeats_last_seen ON agent_heartbeats (last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_agent_heartbeats_status ON agent_heartbeats (status);

-- Indexes for error_logs table
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_name ON error_logs (error_name);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs (resolved);

-- Indexes for account_lockouts table
CREATE INDEX IF NOT EXISTS idx_account_lockouts_username ON account_lockouts (username);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_ip_address ON account_lockouts (ip_address);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_locked_until ON account_lockouts (locked_until);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_last_attempt ON account_lockouts (last_attempt DESC);

-- Indexes for audit_trail table
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_username ON audit_trail (username);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action ON audit_trail (action);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_status ON audit_trail (status);
CREATE INDEX IF NOT EXISTS idx_audit_trail_resource ON audit_trail (resource);

-- Composite indexes for audit_trail
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_timestamp ON audit_trail (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action_timestamp ON audit_trail (action, timestamp DESC);

-- JSONB index for audit_trail details
CREATE INDEX IF NOT EXISTS idx_audit_trail_details_gin ON audit_trail USING GIN (details);

-- Partial indexes for better performance on filtered queries
-- Note: Removed time-based partial index as NOW() is not immutable
-- Use application-level filtering for recent critical logs instead
CREATE INDEX IF NOT EXISTS idx_alerts_open ON alerts (detected_at DESC) 
  WHERE resolved = false;

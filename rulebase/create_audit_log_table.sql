-- ============================================
-- 📋 AUDIT LOG TABLE
-- ============================================
-- Tracks all user actions in the system
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER,
  username VARCHAR(255) NOT NULL,
  role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id VARCHAR(100),
  old_data JSONB,
  new_data JSONB,
  description TEXT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_log_username ON audit_log(username);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);

-- Add comment
COMMENT ON TABLE audit_log IS 'Audit log tracking all user actions in the system';

-- Enable RLS (Row Level Security)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on audit_log" 
ON audit_log 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- ============================================
-- Common action types:
-- - 'login'        User logged in
-- - 'logout'       User logged out
-- - 'create'       Created new record
-- - 'update'       Updated existing record
-- - 'delete'       Deleted record
-- - 'view'         Viewed sensitive data
-- - 'export'       Exported data
-- - 'import'       Imported data
-- ============================================

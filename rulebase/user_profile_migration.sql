-- ==========================================
-- User Profile Enhancement Migration
-- ==========================================
-- Note: Fields F_Name, L_Name, and Signature_path already exist in your database
-- This file documents the expected schema

-- Verify fields exist (these should already be in your database)
-- ALTER TABLE system_users
-- ADD COLUMN IF NOT EXISTS F_Name TEXT,
-- ADD COLUMN IF NOT EXISTS L_Name TEXT,
-- ADD COLUMN IF NOT EXISTS Signature_path TEXT;

-- Add comments for documentation
COMMENT ON COLUMN system_users.F_Name IS 'User first name';
COMMENT ON COLUMN system_users.L_Name IS 'User last name';
COMMENT ON COLUMN system_users.Signature_path IS 'Path/URL to user signature image in Supabase Storage';

-- Create index for faster name searches (if not exists)
CREATE INDEX IF NOT EXISTS idx_system_users_names 
ON system_users(F_Name, L_Name);

-- ==========================================
-- Example Queries
-- ==========================================

-- Update existing user with name
-- UPDATE system_users 
-- SET F_Name = 'Admin', L_Name = 'MedTech'
-- WHERE user_id = 1;

-- Query users with full names
-- SELECT 
--   user_id, 
--   username, 
--   CONCAT(F_Name, ' ', L_Name) as full_name,
--   role,
--   Signature_path
-- FROM system_users
-- WHERE F_Name IS NOT NULL;

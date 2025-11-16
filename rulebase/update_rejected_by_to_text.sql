-- ==========================================
-- Update rejected_by and confirmed_by columns to store names instead of user IDs
-- ==========================================
-- Date: 2025-11-16
-- Purpose: Change rejected_by, confirmed_by_1, and confirmed_by_2 from INTEGER (user_id reference)
--          to TEXT (to store "FirstName LastName" directly for better UX)

-- Drop foreign key constraints first
ALTER TABLE test_request
DROP CONSTRAINT IF EXISTS test_request_rejected_by_fkey,
DROP CONSTRAINT IF EXISTS test_request_confirmed_by_1_fkey,
DROP CONSTRAINT IF EXISTS test_request_confirmed_by_2_fkey;

-- Drop check constraint that references confirmed_by columns
ALTER TABLE test_request
DROP CONSTRAINT IF EXISTS check_different_confirmers;

-- Change column types to TEXT
ALTER TABLE test_request
ALTER COLUMN rejected_by TYPE TEXT USING rejected_by::TEXT,
ALTER COLUMN confirmed_by_1 TYPE TEXT USING confirmed_by_1::TEXT,
ALTER COLUMN confirmed_by_2 TYPE TEXT USING confirmed_by_2::TEXT;

-- Update comments to reflect new usage
COMMENT ON COLUMN test_request.rejected_by IS 'Full name of user who rejected the test request (FirstName LastName)';
COMMENT ON COLUMN test_request.confirmed_by_1 IS 'Full name of first user who confirmed the test request (FirstName LastName)';
COMMENT ON COLUMN test_request.confirmed_by_2 IS 'Full name of second user who confirmed the test request (FirstName LastName)';

-- Note: Check constraint for different confirmers removed since we now store names (strings)
-- The application logic will ensure different users confirm by comparing user_id in session

-- ==========================================
-- Instructions:
-- ==========================================
-- Run this migration in Supabase SQL Editor:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this entire file contents
-- 3. Click "Run"
-- 4. Verify changes in Database > Tables > test_request

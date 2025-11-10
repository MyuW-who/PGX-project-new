-- ==========================================
-- Two-Step Confirmation Workflow Migration
-- ==========================================
-- This migration adds tracking fields for the two-step confirmation system
-- where two different users must confirm a test request before it's marked as done.

-- Add confirmation tracking fields to test_request table
ALTER TABLE test_request
ADD COLUMN IF NOT EXISTS confirmed_by_1 INTEGER REFERENCES system_users(user_id),
ADD COLUMN IF NOT EXISTS confirmed_at_1 TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmed_by_2 INTEGER REFERENCES system_users(user_id),
ADD COLUMN IF NOT EXISTS confirmed_at_2 TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by INTEGER REFERENCES system_users(user_id),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add comment explaining the fields
COMMENT ON COLUMN test_request.confirmed_by_1 IS 'First user who confirmed the test request';
COMMENT ON COLUMN test_request.confirmed_at_1 IS 'Timestamp of first confirmation';
COMMENT ON COLUMN test_request.confirmed_by_2 IS 'Second user who confirmed the test request';
COMMENT ON COLUMN test_request.confirmed_at_2 IS 'Timestamp of second confirmation';
COMMENT ON COLUMN test_request.rejected_by IS 'User who rejected the test request';
COMMENT ON COLUMN test_request.rejected_at IS 'Timestamp of rejection';
COMMENT ON COLUMN test_request.rejection_reason IS 'Reason for rejection provided by the user';

-- Add check constraint to ensure same user doesn't confirm twice
ALTER TABLE test_request
ADD CONSTRAINT check_different_confirmers 
CHECK (confirmed_by_1 IS NULL OR confirmed_by_2 IS NULL OR confirmed_by_1 != confirmed_by_2);

-- Create index for faster queries on confirmation status
CREATE INDEX IF NOT EXISTS idx_test_request_confirmation_status 
ON test_request(confirmed_by_1, confirmed_by_2) 
WHERE confirmed_by_1 IS NOT NULL OR confirmed_by_2 IS NOT NULL;

-- ==========================================
-- Status Flow Documentation
-- ==========================================
-- Status workflow:
-- 1. "need 2 confirmation" (initial state when report uploaded)
-- 2. "need 1 confirmation" (after first user confirms)
-- 3. "done" (after second user confirms)
-- 4. "reject" (if any user rejects at any stage)
--
-- Business Rules:
-- - Same user cannot confirm twice (enforced by check constraint)
-- - First confirmer stored in confirmed_by_1
-- - Second confirmer stored in confirmed_by_2
-- - Rejection stops the workflow immediately
-- - Rejection reason is required and stored

-- ==========================================
-- Example Queries
-- ==========================================

-- Query to see confirmation progress for all requests
-- SELECT 
--     request_id,
--     status,
--     CASE 
--         WHEN confirmed_by_1 IS NOT NULL AND confirmed_by_2 IS NOT NULL THEN 2
--         WHEN confirmed_by_1 IS NOT NULL THEN 1
--         ELSE 0
--     END as confirmation_count,
--     confirmed_by_1,
--     confirmed_by_2,
--     rejected_by
-- FROM test_request
-- WHERE status IN ('need 2 confirmation', 'need 1 confirmation', 'done', 'reject');

-- Query to see who confirmed what
-- SELECT 
--     tr.request_id,
--     tr.status,
--     u1.username as first_confirmer,
--     tr.confirmed_at_1,
--     u2.username as second_confirmer,
--     tr.confirmed_at_2
-- FROM test_request tr
-- LEFT JOIN system_users u1 ON tr.confirmed_by_1 = u1.user_id
-- LEFT JOIN system_users u2 ON tr.confirmed_by_2 = u2.user_id
-- WHERE tr.confirmed_by_1 IS NOT NULL;

-- Add shared_user_ids column to tasks table for individual user sharing
-- Run this in Supabase SQL Editor

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS shared_user_ids uuid[] DEFAULT '{}';

-- Create GIN index for efficient array containment queries
CREATE INDEX IF NOT EXISTS idx_tasks_shared_user_ids ON tasks USING GIN (shared_user_ids);

-- Update RLS policy to allow users to see tasks shared directly with them
-- Drop and recreate the select policy to include shared_user_ids
DROP POLICY IF EXISTS "Users can view own or shared tasks" ON tasks;

CREATE POLICY "Users can view own or shared tasks" ON tasks
FOR SELECT USING (
  user_id = auth.uid()
  OR (is_shared = true AND group_ids && (
    SELECT ARRAY_AGG(group_id) FROM group_memberships 
    WHERE user_id = auth.uid() AND status = 'approved'
  ))
  OR auth.uid() = ANY(shared_user_ids)
);

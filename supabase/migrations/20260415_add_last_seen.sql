-- Migration: Add last_seen column for user presence tracking
-- This column stores the timestamp of the last time a user was active,
-- used to show "last seen" info when users are offline.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

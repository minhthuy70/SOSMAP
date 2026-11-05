-- Migration 015: Add comment threading support
-- Version: 1.0.0
-- Description: Add parent_comment_id to incident_comments for threading

ALTER TABLE incident_comments ADD COLUMN IF NOT EXISTS parent_comment_id INTEGER REFERENCES incident_comments(id) ON DELETE CASCADE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_comment_parent ON incident_comments(parent_comment_id);

-- Add index for fetching comment threads
CREATE INDEX IF NOT EXISTS idx_comment_thread ON incident_comments(incident_id, parent_comment_id);

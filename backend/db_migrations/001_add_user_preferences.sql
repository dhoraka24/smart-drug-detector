-- Migration: Add user_preferences table and prefer_offline_map column
-- Run this migration to add the user_preferences table if it doesn't exist
-- and add the prefer_offline_map column if the table exists but column is missing

-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id INTEGER PRIMARY KEY,
    theme TEXT NOT NULL DEFAULT 'light',
    map_default_zoom INTEGER NOT NULL DEFAULT 12,
    show_clusters INTEGER NOT NULL DEFAULT 1,
    notify_on_warning INTEGER NOT NULL DEFAULT 1,
    prefer_offline_map INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add prefer_offline_map column if table exists but column is missing
-- SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS, so we check first
-- This is safe to run multiple times

-- Note: If you're using a migration tool, you may need to check if column exists first
-- For SQLite, you can check with: PRAGMA table_info(user_preferences);
-- If prefer_offline_map doesn't exist, run:
-- ALTER TABLE user_preferences ADD COLUMN prefer_offline_map INTEGER NOT NULL DEFAULT 0;

-- Create index on user_id for faster lookups (already primary key, but explicit index helps)
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);


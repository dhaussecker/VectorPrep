-- Migration: add tutor_video_url to tool_content
ALTER TABLE tool_content ADD COLUMN IF NOT EXISTS tutor_video_url text;

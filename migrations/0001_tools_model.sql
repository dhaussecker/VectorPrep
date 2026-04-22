-- Migration: rename topics→tools, learn_cards→tool_content, add XP/task tables

-- 1. Add color to courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#22C55E';

-- 2. Rename topics → tools (skip if already renamed)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topics') THEN
    ALTER TABLE topics RENAME TO tools;
  END IF;
END $$;

-- 3. Add status and xp_reward to tools
ALTER TABLE tools ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS xp_reward integer NOT NULL DEFAULT 100;

-- 4. Rename learn_cards → tool_content
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learn_cards') THEN
    ALTER TABLE learn_cards RENAME TO tool_content;
  END IF;
END $$;

-- 5. Rename topic_id → tool_id in tool_content
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tool_content' AND column_name = 'topic_id') THEN
    ALTER TABLE tool_content RENAME COLUMN topic_id TO tool_id;
  END IF;
END $$;

-- 6. Add type, url, image_url to tool_content
ALTER TABLE tool_content ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'text';
ALTER TABLE tool_content ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE tool_content ADD COLUMN IF NOT EXISTS image_url text;

-- 7. Rename question_templates.topic_id → tool_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'question_templates' AND column_name = 'topic_id') THEN
    ALTER TABLE question_templates RENAME COLUMN topic_id TO tool_id;
  END IF;
END $$;

-- 8. Rename user_learn_progress → user_content_progress
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_learn_progress') THEN
    ALTER TABLE user_learn_progress RENAME TO user_content_progress;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_content_progress' AND column_name = 'learn_card_id') THEN
    ALTER TABLE user_content_progress RENAME COLUMN learn_card_id TO content_id;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_content_progress' AND column_name = 'topic_id') THEN
    ALTER TABLE user_content_progress RENAME COLUMN topic_id TO tool_id;
  END IF;
END $$;

-- 9. Rename user_practice_progress.topic_id → tool_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_practice_progress' AND column_name = 'topic_id') THEN
    ALTER TABLE user_practice_progress RENAME COLUMN topic_id TO tool_id;
  END IF;
END $$;

-- 10. Rename cheat_sheet_entries.topic_id → tool_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cheat_sheet_entries' AND column_name = 'topic_id') THEN
    ALTER TABLE cheat_sheet_entries RENAME COLUMN topic_id TO tool_id;
  END IF;
END $$;

-- 11. Rename practice_attempts.topic_id → tool_id
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'practice_attempts' AND column_name = 'topic_id') THEN
    ALTER TABLE practice_attempts RENAME COLUMN topic_id TO tool_id;
  END IF;
END $$;

-- 12. Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id varchar NOT NULL,
  label text NOT NULL,
  xp integer NOT NULL DEFAULT 25,
  order_index integer NOT NULL DEFAULT 0
);

-- 13. Create user_task_progress table
CREATE TABLE IF NOT EXISTS user_task_progress (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL,
  task_id varchar NOT NULL,
  tool_id varchar NOT NULL,
  completed boolean NOT NULL DEFAULT false
);

-- 14. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL UNIQUE,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  streak integer NOT NULL DEFAULT 0,
  last_active_date text
);

-- 15. Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'award',
  unlocked_at timestamp NOT NULL DEFAULT now()
);

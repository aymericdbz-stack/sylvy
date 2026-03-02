-- Add optional free-text description to planner tasks
ALTER TABLE planner_tasks
  ADD COLUMN IF NOT EXISTS description text;

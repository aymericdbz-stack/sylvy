-- ── Planner v2 migration ──────────────────────────────────────────────────────
-- Adds priority + placement to planner_tasks; creates task_templates

ALTER TABLE planner_tasks
  ADD COLUMN IF NOT EXISTS priority  text NOT NULL DEFAULT 'normal'
    CHECK (priority  IN ('critical', 'normal', 'low')),
  ADD COLUMN IF NOT EXISTS placement text NOT NULL DEFAULT 'auto'
    CHECK (placement IN ('manual', 'auto'));

-- ── Task templates ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_templates (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES auth.users NOT NULL,
  name       text        NOT NULL,
  color      text,
  steps      jsonb       NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_templates_user_all" ON task_templates
  FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

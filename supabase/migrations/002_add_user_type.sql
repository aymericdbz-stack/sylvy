-- Add user_type to remember onboarding choice: Researcher vs Lab Manager
-- Researchers cannot access the Resources page; Lab Managers can.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS user_type text NOT NULL DEFAULT 'researcher'
  CHECK (user_type IN ('researcher', 'lab_manager'));

COMMENT ON COLUMN public.users.user_type IS 'Set during onboarding: researcher (default) or lab_manager. Only lab_manager can access Resources.';

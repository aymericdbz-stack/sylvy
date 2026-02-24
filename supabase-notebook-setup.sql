-- ============================================================================
-- SYLVY.CO — NOTEBOOK BACKEND SETUP
-- ============================================================================
-- This script adds all tables required for the /notebook feature.
-- It is ADDITIVE — it does NOT touch the existing tables:
--   • public.clients
--   • public.surveys_pricing
--
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- Project: https://cuepaofrikxgpsobudrm.supabase.co
-- ============================================================================


-- ============================================================================
-- 1. ORGANIZATIONS & USERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users table mirrors auth.users and adds org membership + role.
-- On signup your app should INSERT a row here (see auth trigger below).
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 2. LAB RESOURCES  (Samples · Machines · Reagents)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.samples (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.machines (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  model      TEXT,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reagents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  supplier        TEXT,
  location        TEXT,
  expiration_date DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 3. PROTOCOLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.protocols (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  timing     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.protocol_machines (
  protocol_id UUID NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
  machine_id  UUID NOT NULL REFERENCES public.machines(id) ON DELETE CASCADE,
  PRIMARY KEY (protocol_id, machine_id)
);

CREATE TABLE IF NOT EXISTS public.protocol_reagents (
  protocol_id UUID NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
  reagent_id  UUID NOT NULL REFERENCES public.reagents(id) ON DELETE CASCADE,
  PRIMARY KEY (protocol_id, reagent_id)
);


-- ============================================================================
-- 4. REPORT TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.report_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.template_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.report_templates(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('heading', 'text', 'image_placeholder', 'data_table')),
  "order"     INT  NOT NULL DEFAULT 0,
  content     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 5. EXPERIMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.experiments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  protocol_id        UUID REFERENCES public.protocols(id) ON DELETE SET NULL,
  sample_id          UUID REFERENCES public.samples(id) ON DELETE SET NULL,
  report_template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
  name               TEXT NOT NULL,
  project            TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_edited_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.experiment_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  file_type     TEXT NOT NULL,
  storage_url   TEXT NOT NULL,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 6. REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  template_id   UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
  created_by    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.report_blocks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id         UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  template_block_id UUID REFERENCES public.template_blocks(id) ON DELETE SET NULL,
  type              TEXT NOT NULL CHECK (type IN ('heading', 'text', 'image_placeholder', 'data_table')),
  "order"           INT  NOT NULL DEFAULT 0,
  content           TEXT,
  storage_url       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================================
-- 7. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_org_id                  ON public.users(org_id);
CREATE INDEX IF NOT EXISTS idx_samples_org_id                ON public.samples(org_id);
CREATE INDEX IF NOT EXISTS idx_machines_org_id               ON public.machines(org_id);
CREATE INDEX IF NOT EXISTS idx_reagents_org_id               ON public.reagents(org_id);
CREATE INDEX IF NOT EXISTS idx_protocols_org_id              ON public.protocols(org_id);
CREATE INDEX IF NOT EXISTS idx_template_blocks_template_id   ON public.template_blocks(template_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_org_id       ON public.report_templates(org_id);
CREATE INDEX IF NOT EXISTS idx_experiments_org_id            ON public.experiments(org_id);
CREATE INDEX IF NOT EXISTS idx_experiments_created_at        ON public.experiments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_experiment_files_experiment   ON public.experiment_files(experiment_id);
CREATE INDEX IF NOT EXISTS idx_reports_experiment_id         ON public.reports(experiment_id);
CREATE INDEX IF NOT EXISTS idx_report_blocks_report_id       ON public.report_blocks(report_id);


-- ============================================================================
-- 8. HELPER FUNCTION  (used by RLS policies)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT org_id FROM public.users WHERE id = auth.uid();
$$;


-- ============================================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samples            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reagents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocols          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_machines  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_reagents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_blocks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_files   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_blocks      ENABLE ROW LEVEL SECURITY;

-- ── Organizations ────────────────────────────────────────────────────────────

CREATE POLICY "org: members can view their org"
  ON public.organizations FOR SELECT
  USING (id = public.get_my_org_id());

CREATE POLICY "org: admins can update their org"
  ON public.organizations FOR UPDATE
  USING (
    id = public.get_my_org_id()
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Users ────────────────────────────────────────────────────────────────────

CREATE POLICY "users: view members of same org"
  ON public.users FOR SELECT
  USING (org_id = public.get_my_org_id());

CREATE POLICY "users: insert self on signup"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "users: admins can update org members"
  ON public.users FOR UPDATE
  USING (
    org_id = public.get_my_org_id()
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "users: admins can remove org members"
  ON public.users FOR DELETE
  USING (
    org_id = public.get_my_org_id()
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Samples ──────────────────────────────────────────────────────────────────

CREATE POLICY "samples: org members full access"
  ON public.samples FOR ALL
  USING (org_id = public.get_my_org_id())
  WITH CHECK (org_id = public.get_my_org_id());

-- ── Machines ─────────────────────────────────────────────────────────────────

CREATE POLICY "machines: org members full access"
  ON public.machines FOR ALL
  USING (org_id = public.get_my_org_id())
  WITH CHECK (org_id = public.get_my_org_id());

-- ── Reagents ─────────────────────────────────────────────────────────────────

CREATE POLICY "reagents: org members full access"
  ON public.reagents FOR ALL
  USING (org_id = public.get_my_org_id())
  WITH CHECK (org_id = public.get_my_org_id());

-- ── Protocols ────────────────────────────────────────────────────────────────

CREATE POLICY "protocols: org members full access"
  ON public.protocols FOR ALL
  USING (org_id = public.get_my_org_id())
  WITH CHECK (org_id = public.get_my_org_id());

CREATE POLICY "protocol_machines: scoped to org protocols"
  ON public.protocol_machines FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.protocols
    WHERE protocols.id = protocol_machines.protocol_id
    AND protocols.org_id = public.get_my_org_id()
  ));

CREATE POLICY "protocol_reagents: scoped to org protocols"
  ON public.protocol_reagents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.protocols
    WHERE protocols.id = protocol_reagents.protocol_id
    AND protocols.org_id = public.get_my_org_id()
  ));

-- ── Report Templates ─────────────────────────────────────────────────────────

CREATE POLICY "report_templates: org members full access"
  ON public.report_templates FOR ALL
  USING (org_id = public.get_my_org_id())
  WITH CHECK (org_id = public.get_my_org_id());

CREATE POLICY "template_blocks: scoped to org templates"
  ON public.template_blocks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.report_templates
    WHERE report_templates.id = template_blocks.template_id
    AND report_templates.org_id = public.get_my_org_id()
  ));

-- ── Experiments ──────────────────────────────────────────────────────────────

CREATE POLICY "experiments: org members full access"
  ON public.experiments FOR ALL
  USING (org_id = public.get_my_org_id())
  WITH CHECK (org_id = public.get_my_org_id());

CREATE POLICY "experiment_files: scoped to org experiments"
  ON public.experiment_files FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.experiments
    WHERE experiments.id = experiment_files.experiment_id
    AND experiments.org_id = public.get_my_org_id()
  ));

-- ── Reports ──────────────────────────────────────────────────────────────────

CREATE POLICY "reports: scoped to org experiments"
  ON public.reports FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.experiments
    WHERE experiments.id = reports.experiment_id
    AND experiments.org_id = public.get_my_org_id()
  ));

CREATE POLICY "report_blocks: scoped to org reports"
  ON public.report_blocks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.reports
    JOIN public.experiments ON experiments.id = reports.experiment_id
    WHERE reports.id = report_blocks.report_id
    AND experiments.org_id = public.get_my_org_id()
  ));


-- ============================================================================
-- 10. STORAGE BUCKET  (experiment file uploads)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('experiment-files', 'experiment-files', true)
ON CONFLICT (id) DO NOTHING;

-- Files are stored as:  {org_id}/{experiment_id}/{timestamp}_{filename}
-- Policies check the first folder segment matches the user's org_id.

CREATE POLICY "storage: org members can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'experiment-files'
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "storage: org members can read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'experiment-files'
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "storage: org members can delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'experiment-files'
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM public.users WHERE id = auth.uid()
    )
  );


-- ============================================================================
-- 11. AUTO-UPDATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protocols_updated_at ON public.protocols;
CREATE TRIGGER trg_protocols_updated_at
  BEFORE UPDATE ON public.protocols
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_report_templates_updated_at ON public.report_templates;
CREATE TRIGGER trg_report_templates_updated_at
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- 12. AUTH TRIGGER  — auto-create user row on signup
-- ============================================================================
-- When a new user signs up via Supabase Auth, this trigger creates a row in
-- public.users. The org_id is read from the signup metadata.
--
-- In your frontend signup call, pass the org_id in options.data:
--
--   supabase.auth.signUp({
--     email, password,
--     options: { data: { org_id: '<uuid>', role: 'admin' } }
--   })
--
-- For the very first user (org creation), create the org first via a
-- server-side API route using the service role key, then pass the org_id.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, org_id, email, role)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'org_id')::UUID,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- 13. NOTEBOOK WIZARD TABLES  (standalone, no auth required)
-- ============================================================================
-- These tables back the /notebook/new 7-step wizard flow.
-- They are intentionally simple and auth-free (service role key only).
-- Prefixed with nb_ to avoid collision with the dashboard schema above.

-- Protocols saved from the wizard
CREATE TABLE IF NOT EXISTS public.nb_protocols (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  content    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Experiments created during the wizard flow
CREATE TABLE IF NOT EXISTS public.nb_experiments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id  UUID REFERENCES public.nb_protocols(id) ON DELETE SET NULL,
  notes_raw    TEXT NOT NULL DEFAULT '',
  notes_parsed TEXT NOT NULL DEFAULT '',
  report_json  JSONB,
  status       TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'notes_uploaded', 'report_generated', 'completed')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- QR sessions for mobile photo capture
CREATE TABLE IF NOT EXISTS public.nb_qr_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted')),
  files_data    JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Result files uploaded at the end of the wizard
CREATE TABLE IF NOT EXISTS public.nb_result_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES public.nb_experiments(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  file_type     TEXT NOT NULL,
  file_size     INT,
  file_data     TEXT,
  description   TEXT NOT NULL DEFAULT '',
  protocol_step TEXT,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nb_experiments_protocol ON public.nb_experiments(protocol_id);
CREATE INDEX IF NOT EXISTS idx_nb_qr_sessions_token    ON public.nb_qr_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_nb_result_files_exp     ON public.nb_result_files(experiment_id);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_nb_protocols_updated_at ON public.nb_protocols;
CREATE TRIGGER trg_nb_protocols_updated_at
  BEFORE UPDATE ON public.nb_protocols
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_nb_experiments_updated_at ON public.nb_experiments;
CREATE TRIGGER trg_nb_experiments_updated_at
  BEFORE UPDATE ON public.nb_experiments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_nb_qr_sessions_updated_at ON public.nb_qr_sessions;
CREATE TRIGGER trg_nb_qr_sessions_updated_at
  BEFORE UPDATE ON public.nb_qr_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: these tables are accessed via service role key only (no user-level RLS needed)
-- but we enable it and add a permissive policy so the service role can bypass it.
ALTER TABLE public.nb_protocols     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nb_experiments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nb_qr_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nb_result_files  ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically; these policies allow anon/authenticated
-- reads for the capture page (QR check endpoint is public-facing).
CREATE POLICY "nb_qr_sessions: public read by token"
  ON public.nb_qr_sessions FOR SELECT
  USING (true);

CREATE POLICY "nb_qr_sessions: public insert"
  ON public.nb_qr_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "nb_qr_sessions: public update"
  ON public.nb_qr_sessions FOR UPDATE
  USING (true);


-- ============================================================================
-- DONE ✓
-- ============================================================================
-- Tables added (18):
--   organizations, users,
--   samples, machines, reagents,
--   protocols, protocol_machines, protocol_reagents,
--   report_templates, template_blocks,
--   experiments, experiment_files,
--   reports, report_blocks,
--   nb_protocols, nb_experiments, nb_qr_sessions, nb_result_files
--
-- Existing tables NOT touched:
--   public.clients          ← untouched
--   public.surveys_pricing  ← untouched
--
-- Storage bucket: experiment-files  (public, org-scoped paths)
-- Auth trigger:   on_auth_user_created → auto-populates public.users
-- ============================================================================

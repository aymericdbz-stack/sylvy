-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Organizations
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Users (extends Supabase auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

-- Samples
create table samples (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  owner_id uuid not null references users(id),
  name text not null,
  created_at timestamptz not null default now()
);

-- Machines
create table machines (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  model text,
  status text not null default 'active' check (status in ('active', 'inactive', 'maintenance')),
  created_at timestamptz not null default now()
);

-- Reagents
create table reagents (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  supplier text,
  location text,
  expiration_date date,
  created_at timestamptz not null default now()
);

-- Protocols
create table protocols (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  owner_id uuid not null references users(id),
  name text not null,
  timing interval,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Protocol <-> Machine junction
create table protocol_machines (
  protocol_id uuid not null references protocols(id) on delete cascade,
  machine_id uuid not null references machines(id) on delete cascade,
  primary key (protocol_id, machine_id)
);

-- Protocol <-> Reagent junction
create table protocol_reagents (
  protocol_id uuid not null references protocols(id) on delete cascade,
  reagent_id uuid not null references reagents(id) on delete cascade,
  primary key (protocol_id, reagent_id)
);

-- Report Templates
create table report_templates (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  owner_id uuid not null references users(id),
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Template Blocks
create table template_blocks (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid not null references report_templates(id) on delete cascade,
  "order" integer not null default 0,
  type text not null check (type in ('heading', 'text', 'image_placeholder', 'data_table')),
  content text,
  created_at timestamptz not null default now()
);

-- Experiments
create table experiments (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  owner_id uuid not null references users(id),
  protocol_id uuid references protocols(id) on delete set null,
  sample_id uuid references samples(id) on delete set null,
  report_template_id uuid references report_templates(id) on delete set null,
  name text not null,
  project text,
  created_at timestamptz not null default now(),
  last_edited_at timestamptz not null default now()
);

-- Experiment Files
create table experiment_files (
  id uuid primary key default uuid_generate_v4(),
  experiment_id uuid not null references experiments(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  storage_url text not null,
  uploaded_at timestamptz not null default now()
);

-- Reports
create table reports (
  id uuid primary key default uuid_generate_v4(),
  experiment_id uuid not null references experiments(id) on delete cascade,
  template_id uuid references report_templates(id) on delete set null,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now()
);

-- Report Blocks
create table report_blocks (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid not null references reports(id) on delete cascade,
  template_block_id uuid references template_blocks(id) on delete set null,
  type text not null check (type in ('heading', 'text', 'image_placeholder', 'data_table')),
  "order" integer not null default 0,
  content text,
  storage_url text,
  created_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger protocols_updated_at
  before update on protocols
  for each row execute function update_updated_at();

create trigger report_templates_updated_at
  before update on report_templates
  for each row execute function update_updated_at();

-- Row Level Security
alter table organizations enable row level security;
alter table users enable row level security;
alter table samples enable row level security;
alter table machines enable row level security;
alter table reagents enable row level security;
alter table protocols enable row level security;
alter table protocol_machines enable row level security;
alter table protocol_reagents enable row level security;
alter table report_templates enable row level security;
alter table template_blocks enable row level security;
alter table experiments enable row level security;
alter table experiment_files enable row level security;
alter table reports enable row level security;
alter table report_blocks enable row level security;

-- RLS helper: get current user's org_id
create or replace function get_my_org_id()
returns uuid as $$
  select org_id from users where id = auth.uid()
$$ language sql security definer stable;

-- Organizations
create policy "org_select" on organizations for select using (id = get_my_org_id());
create policy "org_update" on organizations for update using (id = get_my_org_id());

-- Users
create policy "users_select" on users for select using (org_id = get_my_org_id());
create policy "users_insert" on users for insert with check (org_id = get_my_org_id());
create policy "users_update" on users for update using (org_id = get_my_org_id());

-- Samples
create policy "samples_select" on samples for select using (org_id = get_my_org_id());
create policy "samples_insert" on samples for insert with check (org_id = get_my_org_id());
create policy "samples_update" on samples for update using (org_id = get_my_org_id());
create policy "samples_delete" on samples for delete using (org_id = get_my_org_id());

-- Machines
create policy "machines_select" on machines for select using (org_id = get_my_org_id());
create policy "machines_insert" on machines for insert with check (org_id = get_my_org_id());
create policy "machines_update" on machines for update using (org_id = get_my_org_id());
create policy "machines_delete" on machines for delete using (org_id = get_my_org_id());

-- Reagents
create policy "reagents_select" on reagents for select using (org_id = get_my_org_id());
create policy "reagents_insert" on reagents for insert with check (org_id = get_my_org_id());
create policy "reagents_update" on reagents for update using (org_id = get_my_org_id());
create policy "reagents_delete" on reagents for delete using (org_id = get_my_org_id());

-- Protocols
create policy "protocols_select" on protocols for select using (org_id = get_my_org_id());
create policy "protocols_insert" on protocols for insert with check (org_id = get_my_org_id());
create policy "protocols_update" on protocols for update using (org_id = get_my_org_id());
create policy "protocols_delete" on protocols for delete using (org_id = get_my_org_id());

-- Protocol junctions (check via protocol's org_id)
create policy "protocol_machines_select" on protocol_machines for select
  using (exists (select 1 from protocols p where p.id = protocol_id and p.org_id = get_my_org_id()));
create policy "protocol_machines_insert" on protocol_machines for insert
  with check (exists (select 1 from protocols p where p.id = protocol_id and p.org_id = get_my_org_id()));
create policy "protocol_machines_delete" on protocol_machines for delete
  using (exists (select 1 from protocols p where p.id = protocol_id and p.org_id = get_my_org_id()));

create policy "protocol_reagents_select" on protocol_reagents for select
  using (exists (select 1 from protocols p where p.id = protocol_id and p.org_id = get_my_org_id()));
create policy "protocol_reagents_insert" on protocol_reagents for insert
  with check (exists (select 1 from protocols p where p.id = protocol_id and p.org_id = get_my_org_id()));
create policy "protocol_reagents_delete" on protocol_reagents for delete
  using (exists (select 1 from protocols p where p.id = protocol_id and p.org_id = get_my_org_id()));

-- Report Templates
create policy "report_templates_select" on report_templates for select using (org_id = get_my_org_id());
create policy "report_templates_insert" on report_templates for insert with check (org_id = get_my_org_id());
create policy "report_templates_update" on report_templates for update using (org_id = get_my_org_id());
create policy "report_templates_delete" on report_templates for delete using (org_id = get_my_org_id());

-- Template Blocks (via template's org_id)
create policy "template_blocks_select" on template_blocks for select
  using (exists (select 1 from report_templates t where t.id = template_id and t.org_id = get_my_org_id()));
create policy "template_blocks_insert" on template_blocks for insert
  with check (exists (select 1 from report_templates t where t.id = template_id and t.org_id = get_my_org_id()));
create policy "template_blocks_update" on template_blocks for update
  using (exists (select 1 from report_templates t where t.id = template_id and t.org_id = get_my_org_id()));
create policy "template_blocks_delete" on template_blocks for delete
  using (exists (select 1 from report_templates t where t.id = template_id and t.org_id = get_my_org_id()));

-- Experiments
create policy "experiments_select" on experiments for select using (org_id = get_my_org_id());
create policy "experiments_insert" on experiments for insert with check (org_id = get_my_org_id());
create policy "experiments_update" on experiments for update using (org_id = get_my_org_id());
create policy "experiments_delete" on experiments for delete using (org_id = get_my_org_id());

-- Experiment Files
create policy "experiment_files_select" on experiment_files for select
  using (exists (select 1 from experiments e where e.id = experiment_id and e.org_id = get_my_org_id()));
create policy "experiment_files_insert" on experiment_files for insert
  with check (exists (select 1 from experiments e where e.id = experiment_id and e.org_id = get_my_org_id()));
create policy "experiment_files_delete" on experiment_files for delete
  using (exists (select 1 from experiments e where e.id = experiment_id and e.org_id = get_my_org_id()));

-- Reports
create policy "reports_select" on reports for select
  using (exists (select 1 from experiments e where e.id = experiment_id and e.org_id = get_my_org_id()));
create policy "reports_insert" on reports for insert
  with check (exists (select 1 from experiments e where e.id = experiment_id and e.org_id = get_my_org_id()));
create policy "reports_delete" on reports for delete
  using (exists (select 1 from experiments e where e.id = experiment_id and e.org_id = get_my_org_id()));

-- Report Blocks
create policy "report_blocks_select" on report_blocks for select
  using (exists (select 1 from reports r join experiments e on e.id = r.experiment_id where r.id = report_id and e.org_id = get_my_org_id()));
create policy "report_blocks_insert" on report_blocks for insert
  with check (exists (select 1 from reports r join experiments e on e.id = r.experiment_id where r.id = report_id and e.org_id = get_my_org_id()));
create policy "report_blocks_update" on report_blocks for update
  using (exists (select 1 from reports r join experiments e on e.id = r.experiment_id where r.id = report_id and e.org_id = get_my_org_id()));
create policy "report_blocks_delete" on report_blocks for delete
  using (exists (select 1 from reports r join experiments e on e.id = r.experiment_id where r.id = report_id and e.org_id = get_my_org_id()));

-- Storage bucket
insert into storage.buckets (id, name, public) values ('experiment-files', 'experiment-files', false)
  on conflict (id) do nothing;

create policy "experiment_files_upload" on storage.objects for insert
  with check (bucket_id = 'experiment-files' and auth.role() = 'authenticated');
create policy "experiment_files_download" on storage.objects for select
  using (bucket_id = 'experiment-files' and auth.role() = 'authenticated');
create policy "experiment_files_delete_storage" on storage.objects for delete
  using (bucket_id = 'experiment-files' and auth.role() = 'authenticated');

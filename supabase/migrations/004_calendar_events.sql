create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  color text,
  experiment_id uuid references experiments(id) on delete set null,
  protocol_id uuid references protocols(id) on delete set null,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table calendar_events enable row level security;

create policy "calendar_events_select" on calendar_events for select using (org_id = get_my_org_id());
create policy "calendar_events_insert" on calendar_events for insert with check (org_id = get_my_org_id());
create policy "calendar_events_update" on calendar_events for update using (org_id = get_my_org_id());
create policy "calendar_events_delete" on calendar_events for delete using (org_id = get_my_org_id());

create trigger calendar_events_updated_at
  before update on calendar_events
  for each row execute function update_updated_at();

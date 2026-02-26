create table planner_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  deadline timestamptz,
  steps jsonb not null default '[]',
  scheduled_start timestamptz,
  color text,
  conflict boolean default false,
  conflict_reason text,
  created_at timestamptz default now()
);

alter table planner_tasks enable row level security;

create policy "Users see own tasks" on planner_tasks
  for all using (auth.uid() = user_id);

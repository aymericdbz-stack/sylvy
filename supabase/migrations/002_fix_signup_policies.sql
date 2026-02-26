-- Fix: organizations had no INSERT policy → new users couldn't create an org
create policy "org_insert" on organizations
  for insert with check (auth.uid() is not null);

-- Fix: users_insert used get_my_org_id() which returns NULL for brand-new users
-- (chicken-and-egg: no row exists yet so the function returns null → INSERT always denied)
-- Replace with a simple check: a user can only insert their own record
drop policy if exists "users_insert" on users;
create policy "users_insert" on users
  for insert with check (id = auth.uid());

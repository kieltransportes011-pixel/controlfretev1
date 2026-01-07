
create table if not exists public.account_activity_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    action text not null,
    actor text default 'user' check (actor in ('user', 'admin', 'system')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index if not exists idx_account_activity_user on public.account_activity_logs(user_id);
create index if not exists idx_account_activity_created on public.account_activity_logs(created_at);

-- RLS
alter table public.account_activity_logs enable row level security;

-- Policies
create policy "Users can view their own activity logs"
on public.account_activity_logs for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own activity logs"
on public.account_activity_logs for insert
to authenticated
with check (user_id = auth.uid());

create policy "Admins can view all activity logs"
on public.account_activity_logs for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Admins can insert activity logs for others"
on public.account_activity_logs for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- Trigger to log password updates automatically?
-- Supabase auth.users is distinct from public schema. 
-- We can't easily trigger on auth.users from here without being superuser/extensions.
-- We will handle password change logging from the client side where the update occurs.

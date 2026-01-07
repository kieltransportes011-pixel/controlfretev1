-- Drop table if exists to ensure clean slate matching new requirements
drop table if exists admin_logs;

create table admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  action text not null,
  target_type text not null, -- 'user', 'support_ticket', 'system'
  target_id uuid, -- nullable
  description text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table admin_logs enable row level security;

-- Policy: Admins can insert logs
create policy "Admins can insert logs"
on admin_logs for insert
to authenticated
with check (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- Policy: Admins can view logs
create policy "Admins can view all logs"
on admin_logs for select
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- Policy: No update/delete for ANYONE (Audit trail)
-- Implicitly denied by default as no policies are created for UPDATE/DELETE

NOTIFY pgrst, 'reload config';

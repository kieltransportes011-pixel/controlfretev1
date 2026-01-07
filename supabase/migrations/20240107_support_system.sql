create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  category text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  admin_reply text,
  attachment_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table support_tickets enable row level security;

-- Policy: Users can insert their own tickets
create policy "Users can insert own tickets"
on support_tickets for insert
to authenticated
with check (auth.uid() = user_id);

-- Policy: Users can view their own tickets
create policy "Users can view own tickets"
on support_tickets for select
to authenticated
using (auth.uid() = user_id);

-- Policy: Admins can view all tickets
create policy "Admins can view all tickets"
on support_tickets for select
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- Policy: Admins can update tickets
create policy "Admins can update all tickets"
on support_tickets for update
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

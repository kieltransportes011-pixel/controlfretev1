
create table if not exists public.platform_notices (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    summary text,
    content text not null,
    level text check (level in ('info', 'important', 'critical')) not null default 'info',
    is_mandatory boolean default false,
    is_active boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.notice_reads (
    id uuid default gen_random_uuid() primary key,
    notice_id uuid references public.platform_notices(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    read_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(notice_id, user_id)
);

-- Indexes
create index if not exists idx_platform_notices_active on public.platform_notices(is_active);
create index if not exists idx_notice_reads_user on public.notice_reads(user_id);
create index if not exists idx_notice_reads_notice on public.notice_reads(notice_id);

-- RLS Enable
alter table public.platform_notices enable row level security;
alter table public.notice_reads enable row level security;

-- Policies for platform_notices
create policy "Public (Auth) can view active notices"
on public.platform_notices for select
to authenticated
using (is_active = true);

create policy "Admins can view all notices"
on public.platform_notices for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Admins can insert notices"
on public.platform_notices for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Admins can update notices"
on public.platform_notices for update
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Admins can delete notices"
on public.platform_notices for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

-- Policies for notice_reads
create policy "Users can see their own reads"
on public.notice_reads for select
to authenticated
using (user_id = auth.uid());

create policy "Admins can see all reads"
on public.notice_reads for select
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);

create policy "Users can insert their own reads"
on public.notice_reads for insert
to authenticated
with check (user_id = auth.uid());

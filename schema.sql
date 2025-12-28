-- Create Profiles Table (extends Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  cpf text,
  referral_code text,
  referral_balance numeric default 0,
  referral_count integer default 0,
  referred_by text,
  premium_until timestamptz,
  last_payment_id text,
  created_at timestamptz default now(),
  is_premium boolean default false
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Freights Table
create table public.freights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  date date not null,
  client text not null,
  total_value numeric not null,
  company_value numeric not null,
  driver_value numeric not null,
  reserve_value numeric not null,
  status text check (status in ('PAID', 'PARTIAL', 'PENDING')),
  received_value numeric default 0,
  pending_value numeric default 0,
  due_date date,
  created_at timestamptz default now()
);

-- RLS for Freights
alter table public.freights enable row level security;

create policy "Users can crud own freights" on public.freights
  for all using (auth.uid() = user_id);

-- Expenses Table
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  date date not null,
  description text not null,
  value numeric not null,
  source text not null,
  category text,
  created_at timestamptz default now()
);

-- RLS for Expenses
alter table public.expenses enable row level security;

create policy "Users can crud own expenses" on public.expenses
  for all using (auth.uid() = user_id);

-- Settings Table
create table public.settings (
  user_id uuid references public.profiles(id) primary key,
  theme text default 'light',
  default_company_percent numeric default 40,
  default_driver_percent numeric default 40,
  default_reserve_percent numeric default 20,
  monthly_goal numeric,
  issuer_name text
);

-- RLS for Settings
alter table public.settings enable row level security;

create policy "Users can crud own settings" on public.settings
  for all using (auth.uid() = user_id);

-- Bookings Table (Agenda)
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  date date not null,
  client text not null,
  time time,
  estimated_value numeric,
  status text default 'SCHEDULED',
  created_at timestamptz default now()
);

-- RLS for Bookings
alter table public.bookings enable row level security;

create policy "Users can crud own bookings" on public.bookings
  for all using (auth.uid() = user_id);

-- Setup Storage for future use (optional)
insert into storage.buckets (id, name)
values ('avatars', 'avatars')
on conflict do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

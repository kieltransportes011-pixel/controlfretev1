-- Módulo "Parceiros": vitrine de descontos/benefícios para caminhoneiros.
-- Sem regra de comissão/patrocínio ainda (fase futura, adicionada depois como
-- migration aditiva) — schema enxuto de propósito, só o necessário pra listar
-- parceiros, ofertas e capturar interesse (lead).

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Outros',
  description text,
  logo_url text,
  cover_image_url text,
  whatsapp_phone text,        -- dígitos com DDI, ex: 5511999998888
  website_url text,
  city text,
  state text,                 -- UF, ex: SP
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_offers (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.partners(id) on delete cascade,
  title text not null,          -- ex: "10% de desconto em pneus"
  description text,
  rules text,
  valid_until date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  offer_id uuid references public.partner_offers(id) on delete set null,
  -- Snapshot no momento do clique em "Quero esse benefício": profiles só
  -- pode ser lido pelo próprio dono (sem policy de admin-vê-tudo), então um
  -- join do admin com profiles sempre voltaria null. Guardar aqui evita
  -- precisar de outra função SECURITY DEFINER (RPC) só pra isso.
  user_name text,
  user_phone text,
  user_partner_code text,
  status text not null default 'novo' check (status in ('novo','contatado','convertido','descartado')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_partner_offers_partner on public.partner_offers(partner_id);
create index if not exists idx_partner_leads_user on public.partner_leads(user_id);
create index if not exists idx_partner_leads_partner on public.partner_leads(partner_id);

alter table public.profiles add column if not exists partner_code text unique;

alter table public.partners enable row level security;
alter table public.partner_offers enable row level security;
alter table public.partner_leads enable row level security;

-- partners: vitrine liberada pra quem está logado (só parceiros ativos),
-- gestão (criar/editar/ativar/desativar) só de admin.
create policy "Authenticated can view active partners"
on public.partners for select to authenticated
using (is_active = true);

create policy "Admins can view all partners"
on public.partners for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can insert partners" on public.partners for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can update partners" on public.partners for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can delete partners" on public.partners for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- partner_offers: mesma lógica das ofertas.
create policy "Authenticated can view active offers"
on public.partner_offers for select to authenticated
using (is_active = true);

create policy "Admins can view all offers" on public.partner_offers for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can insert offers" on public.partner_offers for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can update offers" on public.partner_offers for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can delete offers" on public.partner_offers for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- partner_leads: usuário só cria/vê o próprio lead (with check bloqueia
-- inserir com user_id de outra pessoa); admin vê e atualiza (status/notas)
-- tudo. Sem update/delete pro usuário (lead é fixo após enviado, igual
-- support_tickets) e sem delete nem pra admin (é registro histórico).
create policy "Users can insert own leads" on public.partner_leads for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can view own leads" on public.partner_leads for select to authenticated
using (auth.uid() = user_id);

create policy "Admins can view all leads" on public.partner_leads for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can update leads" on public.partner_leads for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

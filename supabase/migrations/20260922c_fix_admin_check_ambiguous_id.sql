-- Fix real do painel admin ficando zerado: a função declara
-- "returns table (id uuid, ...)", e isso cria uma variável interna
-- chamada "id" dentro do corpo da função (um pra cada coluna de retorno).
-- A checagem de admin usava "id" sem qualificar:
--   where id = auth.uid()
-- e o Postgres não sabe se isso é a variável de retorno "id" ou a coluna
-- profiles.id — erro 42702 "column reference id is ambiguous", só em
-- tempo de execução (a criação da função não valida o SQL interno).
-- Resultado: a RPC sempre falhava, mesmo pro admin de verdade, e como
-- fetchDashboardData dependia dela primeiro, o painel inteiro zerava.

create or replace function public.get_admin_users_with_freight_counts()
returns table (
  id uuid,
  email text,
  name text,
  plano text,
  status_assinatura text,
  is_premium boolean,
  premium_until timestamptz,
  account_status text,
  role text,
  created_at timestamptz,
  admin_notes text,
  referral_code text,
  referral_count integer,
  total_freights bigint,
  cf_coins_balance integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin') then
    raise exception 'Acesso restrito a administradores.';
  end if;

  return query
    select
      p.id, p.email, p.name, p.plano, p.status_assinatura, p.is_premium,
      p.premium_until, p.account_status, p.role, p.created_at, p.admin_notes,
      p.referral_code, p.referral_count,
      coalesce(f.freight_count, 0) as total_freights,
      coalesce(w.balance, 0) as cf_coins_balance
    from public.profiles p
    left join (
      select user_id, count(*) as freight_count
      from public.freights
      group by user_id
    ) f on f.user_id = p.id
    left join public.cf_wallet w on w.user_id = p.id
    order by p.created_at desc;
end;
$$;

revoke execute on function public.get_admin_users_with_freight_counts() from public, anon;
grant execute on function public.get_admin_users_with_freight_counts() to authenticated;

-- Painel Admin (Fase 2): substitui a busca de usuários (select * + N
-- consultas separadas, uma por usuário, só pra contar fretes) por uma única
-- função que já traz a contagem via LEFT JOIN, e só as colunas que a tela
-- realmente usa — sem puxar CPF/dados sensíveis pra memória sem necessidade.

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
  total_freights bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Acesso restrito a administradores.';
  end if;

  return query
    select
      p.id, p.email, p.name, p.plano, p.status_assinatura, p.is_premium,
      p.premium_until, p.account_status, p.role, p.created_at, p.admin_notes,
      p.referral_code, p.referral_count,
      coalesce(f.freight_count, 0) as total_freights
    from public.profiles p
    left join (
      select user_id, count(*) as freight_count
      from public.freights
      group by user_id
    ) f on f.user_id = p.id
    order by p.created_at desc;
end;
$$;

revoke execute on function public.get_admin_users_with_freight_counts() from public, anon;
grant execute on function public.get_admin_users_with_freight_counts() to authenticated;

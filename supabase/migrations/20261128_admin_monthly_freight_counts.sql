-- Leitura (só admin): quantos fretes cada usuário lançou no mês atual (fuso de São Paulo).
-- Usada no painel admin para listar quem bateu o limite do plano gratuito.
-- Aplicada em produção em 28/11/2026 com aprovação do Kiel.
create or replace function public.get_admin_monthly_freight_counts()
returns table(user_id uuid, month_freights bigint)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito a administradores.';
  end if;
  return query
    select f.user_id, count(*)::bigint
    from public.freights f
    where coalesce(f.created_at, f.date::timestamptz) >= (date_trunc('month', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo')
    group by f.user_id;
end;
$$;
revoke all on function public.get_admin_monthly_freight_counts() from public, anon;
grant execute on function public.get_admin_monthly_freight_counts() to authenticated;

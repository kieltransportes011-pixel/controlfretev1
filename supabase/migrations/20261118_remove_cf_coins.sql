-- Remove o sistema de CF Coins por inteiro. A unica coisa amarrada a ele que
-- precisava de substituto era a recompensa de indicacao (antes +10/+5 CF) -
-- agora vira dias extras de teste PRO direto: quem se cadastra por indicacao
-- ganha 10 dias de trial (7 padrao + 3 de bonus), quem indicou ganha +5 dias.

-- 1. Reescreve o trigger de novo usuario sem as chamadas a award_cf_coins.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
declare
  v_is_premium boolean := false;
  v_plano text := 'FREE';
  v_premium_until timestamptz := null;
  v_referrer_id uuid;
  v_trial_end timestamptz := null;
begin
  if (extract(year from now()) = 2026 and extract(month from now()) = 2) then
    v_is_premium := true;
    v_plano := 'PRO';
    v_premium_until := '2026-02-28 23:59:59-03';
  end if;

  v_referrer_id := cast(nullif(new.raw_user_meta_data->>'referrer_id', '') as uuid);

  if v_referrer_id is not null then
    v_trial_end := now() + interval '10 days';
  end if;

  insert into public.profiles (
    id, email, name, cpf, referrer_id, plano, status_assinatura, is_premium, premium_until, trial_end, created_at
  )
  values (
    new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''), new.raw_user_meta_data->>'cpf',
    v_referrer_id, v_plano, 'ativa', v_is_premium, v_premium_until, v_trial_end, now()
  )
  on conflict (id) do nothing;

  insert into public.settings (user_id, theme) values (new.id, 'light') on conflict (user_id) do nothing;

  if v_referrer_id is not null then
    update public.profiles
    set trial_end = greatest(coalesce(trial_end, now()), now()) + interval '5 days'
    where id = v_referrer_id;
  end if;

  return new;
end;
$function$;

-- 2. Remove a coluna cf_coins_balance da RPC do painel admin (precisa
-- DROP+CREATE porque CREATE OR REPLACE nao deixa tirar coluna do RETURNS TABLE).
DROP FUNCTION IF EXISTS public.get_admin_users_with_freight_counts();

CREATE FUNCTION public.get_admin_users_with_freight_counts()
 RETURNS TABLE(id uuid, email text, name text, plano text, status_assinatura text, is_premium boolean, premium_until timestamp with time zone, account_status text, role text, created_at timestamp with time zone, admin_notes text, referral_code text, referral_count integer, total_freights bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin') then
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
$function$;

-- 3. Remove as funcoes que so existiam pra gastar/ganhar CF Coins.
DROP FUNCTION IF EXISTS public.claim_profile_bonus();
DROP FUNCTION IF EXISTS public.redeem_trial_extension();
DROP FUNCTION IF EXISTS public.award_cf_coins(uuid, integer, text);

-- 4. Remove as tabelas e a coluna de controle do bonus de perfil.
DROP TABLE IF EXISTS public.cf_transactions;
DROP TABLE IF EXISTS public.cf_wallet;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS cf_profile_bonus_claimed;

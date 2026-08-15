-- CF Coins (MVP): carteira interna de créditos, resgatável em benefícios
-- reais do app. Escopo enxuto de propósito — só ganhar via indicação/perfil
-- completo, só gastar em +dias de teste PRO — pra não virar confuso.

create table public.cf_wallet (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.cf_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.cf_wallet enable row level security;
alter table public.cf_transactions enable row level security;

create policy "Users can view own wallet" on public.cf_wallet
  for select using ((select auth.uid()) = user_id);

create policy "Users can view own transactions" on public.cf_transactions
  for select using ((select auth.uid()) = user_id);

create index idx_cf_transactions_user_id on public.cf_transactions(user_id);

alter table public.profiles add column if not exists cf_profile_bonus_claimed boolean not null default false;

-- Helper interno: credita/debita de forma atômica, nunca chamado direto pelo cliente
create or replace function public.award_cf_coins(p_user_id uuid, p_amount integer, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cf_wallet (user_id, balance, updated_at)
  values (p_user_id, p_amount, now())
  on conflict (user_id) do update set balance = cf_wallet.balance + p_amount, updated_at = now();

  insert into public.cf_transactions (user_id, amount, reason)
  values (p_user_id, p_amount, p_reason);
end;
$$;

revoke execute on function public.award_cf_coins(uuid, integer, text) from public, anon, authenticated;

-- RPC: bônus único por completar o perfil (dados do emissor em Configurações)
create or replace function public.claim_profile_bonus()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_already_claimed boolean;
  v_settings record;
begin
  if v_user_id is null then
    raise exception 'Não autenticado.';
  end if;

  select cf_profile_bonus_claimed into v_already_claimed from public.profiles where id = v_user_id;
  if v_already_claimed then
    return jsonb_build_object('claimed', false, 'reason', 'already_claimed');
  end if;

  select issuer_name, issuer_doc, issuer_phone, issuer_address_city
  into v_settings
  from public.settings where user_id = v_user_id;

  if v_settings.issuer_name is null or v_settings.issuer_name = ''
     or v_settings.issuer_doc is null or v_settings.issuer_doc = ''
     or v_settings.issuer_phone is null or v_settings.issuer_phone = ''
     or v_settings.issuer_address_city is null or v_settings.issuer_address_city = '' then
    return jsonb_build_object('claimed', false, 'reason', 'incomplete_profile');
  end if;

  update public.profiles set cf_profile_bonus_claimed = true where id = v_user_id;
  perform public.award_cf_coins(v_user_id, 5, 'Perfil completo');

  return jsonb_build_object('claimed', true, 'amount', 5);
end;
$$;

revoke execute on function public.claim_profile_bonus() from public, anon;
grant execute on function public.claim_profile_bonus() to authenticated;

-- RPC: trocar 20 CF por +3 dias de teste PRO
create or replace function public.redeem_trial_extension()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance integer;
  v_cost integer := 20;
  v_current_trial_end timestamptz;
  v_new_trial_end timestamptz;
begin
  if v_user_id is null then
    raise exception 'Não autenticado.';
  end if;

  select balance into v_balance from public.cf_wallet where user_id = v_user_id;
  v_balance := coalesce(v_balance, 0);

  if v_balance < v_cost then
    return jsonb_build_object('redeemed', false, 'reason', 'insufficient_balance', 'balance', v_balance, 'cost', v_cost);
  end if;

  select trial_end into v_current_trial_end from public.profiles where id = v_user_id;
  v_new_trial_end := greatest(coalesce(v_current_trial_end, now()), now()) + interval '3 days';

  update public.profiles set trial_end = v_new_trial_end where id = v_user_id;
  perform public.award_cf_coins(v_user_id, -v_cost, 'Resgate: +3 dias de teste PRO');

  return jsonb_build_object('redeemed', true, 'new_trial_end', v_new_trial_end);
end;
$$;

revoke execute on function public.redeem_trial_extension() from public, anon;
grant execute on function public.redeem_trial_extension() to authenticated;

-- Bônus de indicação: quem indicou ganha 10, quem se cadastrou via indicação ganha 5
create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'auth', 'extensions'
as $function$
declare
  v_is_premium boolean := false;
  v_plano text := 'FREE';
  v_premium_until timestamptz := null;
  v_referrer_id uuid;
begin
  if (extract(year from now()) = 2026 and extract(month from now()) = 2) then
    v_is_premium := true;
    v_plano := 'PRO';
    v_premium_until := '2026-02-28 23:59:59-03';
  end if;

  v_referrer_id := cast(nullif(new.raw_user_meta_data->>'referrer_id', '') as uuid);

  insert into public.profiles (
    id, email, name, cpf, referrer_id, plano, status_assinatura, is_premium, premium_until, created_at
  )
  values (
    new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''), new.raw_user_meta_data->>'cpf',
    v_referrer_id, v_plano, 'ativa', v_is_premium, v_premium_until, now()
  )
  on conflict (id) do nothing;

  insert into public.settings (user_id, theme) values (new.id, 'light') on conflict (user_id) do nothing;

  if v_referrer_id is not null then
    perform public.award_cf_coins(new.id, 5, 'Bônus de boas-vindas (indicação)');
    perform public.award_cf_coins(v_referrer_id, 10, 'Indicação de novo usuário');
  end if;

  return new;
end;
$function$;

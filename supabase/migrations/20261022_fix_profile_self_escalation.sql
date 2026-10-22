-- CORRECAO DE SEGURANCA CRITICA: a politica RLS "Users can update own profile"
-- so verifica QUEM e o dono da linha (auth.uid() = id), nunca QUAIS colunas
-- estao sendo alteradas. Isso permite que qualquer usuario logado rode, pelo
-- proprio navegador, algo como:
--   supabase.from('profiles').update({ role: 'admin' }).eq('id', meuId)
-- e vire administrador sozinho (ou se promova a plano PRO de graca, ou se
-- desbaneie mudando account_status). Esse trigger trava os campos
-- administrativos/financeiros contra qualquer sessao que nao seja a chave
-- privilegiada (service_role, usada pelo admin-actions, pelo webhook do
-- Mercado Pago e pelo reprocess-payments), preservando as duas funcoes de
-- auto-servico legitimas que tambem tocam o perfil (redeem_trial_extension
-- e claim_profile_bonus).

create or replace function public.protect_sensitive_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- admin-actions, mercado-pago-webhook e reprocess-payments usam a chave
  -- privilegiada (service_role) e passam direto, sem restricao.
  if auth.role() = 'service_role' then
    return new;
  end if;

  -- Campos exclusivamente administrativos/de pagamento: nenhuma rotina de
  -- auto-servico do usuario mexe neles, entao ficam sempre travados fora
  -- da chave privilegiada.
  new.role := old.role;
  new.account_status := old.account_status;
  new.is_premium := old.is_premium;
  new.plano := old.plano;
  new.status_assinatura := old.status_assinatura;
  new.premium_until := old.premium_until;
  new.last_payment_id := old.last_payment_id;
  new.admin_notes := old.admin_notes;
  new.referrer_id := old.referrer_id;
  new.referral_balance := old.referral_balance;
  new.referral_count := old.referral_count;
  new.partner_code := old.partner_code;

  -- trial_end so pode avancar ate 3 dias por vez (exatamente o que
  -- redeem_trial_extension() faz) - bloqueia pular direto pra uma data
  -- arbitraria no futuro, sem quebrar o resgate legitimo.
  if new.trial_end is distinct from old.trial_end
     and new.trial_end > greatest(coalesce(old.trial_end, now()), now()) + interval '3 days' then
    new.trial_end := old.trial_end;
  end if;

  -- cf_profile_bonus_claimed so pode ir de false pra true (exatamente a
  -- transicao que claim_profile_bonus() faz) - bloqueia resetar pra false
  -- e reivindicar o bonus de novo.
  if new.cf_profile_bonus_claimed is distinct from old.cf_profile_bonus_claimed
     and not (old.cf_profile_bonus_claimed is not true and new.cf_profile_bonus_claimed is true) then
    new.cf_profile_bonus_claimed := old.cf_profile_bonus_claimed;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_sensitive_profile_columns on public.profiles;
create trigger trg_protect_sensitive_profile_columns
before update on public.profiles
for each row execute function public.protect_sensitive_profile_columns();

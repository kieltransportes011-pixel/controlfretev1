-- Fix: protect_sensitive_profile_columns() ainda referenciava
-- profiles.cf_profile_bonus_claimed, coluna removida em
-- 20261118_remove_cf_coins.sql. Isso quebrava QUALQUER update em
-- `profiles` feito fora do service_role (ex: usuario comum editando o
-- proprio nome/foto em Configuracoes, ou o trigger handle_payment_approved
-- cascateando a partir de payment_history) com o erro:
--   record "new" has no field "cf_profile_bonus_claimed"
--
-- Aplicado direto em producao em 2026-11-25 durante a investigacao do bug
-- de pagamento (webhook do Mercado Pago com verify_jwt incorreto); esta
-- migration so documenta no repositorio o que ja foi rodado no banco.
--
-- Nada mais muda: mesmo bypass pra service_role, mesmas colunas protegidas,
-- mesma regra de trial_end - so remove o bloco morto do cf_profile_bonus_claimed.
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

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

  if new.trial_end is distinct from old.trial_end
     and new.trial_end > greatest(coalesce(old.trial_end, now()), now()) + interval '3 days' then
    new.trial_end := old.trial_end;
  end if;

  return new;
end;
$function$;

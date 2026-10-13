-- Rastreia quando foi o ultimo push de "revisao pendente" enviado pra cada
-- veiculo, pra evitar notificar todo dia enquanto a condicao persistir (uma
-- revisao vencida nao "expira" sozinha como uma conta a pagar). O cron
-- (check-vehicle-revisions) so reenvia depois de 3 dias desde o ultimo envio.
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS last_revision_alert_at timestamptz;

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'check-vehicle-revisions-daily',
  '0 12 * * *', -- 12:00 UTC = 09:00 BRT, 1h depois do check-due-bills (11:00 UTC)
  $$
  select net.http_post(
    url := 'https://pwfbgcbchhtumvwjrlep.supabase.co/functions/v1/check-vehicle-revisions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

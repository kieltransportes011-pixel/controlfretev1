-- So rode isto DEPOIS de dar deploy na Edge Function
-- check-document-expirations (npx supabase functions deploy
-- check-document-expirations). Rodar antes disso nao quebra nada - o cron
-- so vai falhar silenciosamente (404) ate a function existir.

select cron.schedule(
  'check-document-expirations-daily',
  '0 13 * * *', -- 13:00 UTC = 10:00 BRT, 1h depois do check-vehicle-revisions
  $$
  select net.http_post(
    url := 'https://pwfbgcbchhtumvwjrlep.supabase.co/functions/v1/check-document-expirations',
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

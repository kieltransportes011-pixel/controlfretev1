-- Agenda a checagem diária de contas a vencer (Fase 3 do plano de push
-- notifications). O valor real da service role key NÃO está aqui — fica
-- guardado no Vault (vault.create_secret, rodado manualmente pelo usuário),
-- essa migration só referencia o nome do segredo.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'check-due-bills-daily',
  '0 11 * * *', -- 11:00 UTC = 08:00 no horário de Brasília
  $$
  select net.http_post(
    url := 'https://pwfbgcbchhtumvwjrlep.supabase.co/functions/v1/check-due-bills',
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

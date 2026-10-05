-- Segunda leva de push pra outubro: as 3 mensagens aprovadas (convidar
-- amigos, CF Coins/descontos futuros, status de teste), 2x por semana
-- (quarta e sábado) até o fim do mês, em horários variados — não nos
-- mesmos dias da campanha de transição pra Play Store já agendada
-- (terça/sexta), pra não empilhar duas notificações no mesmo dia.
--
-- O cron de envio rodava só 1x/dia às 10h BRT — com os horários agora
-- espalhados ao longo do dia, isso faria todo mundo "escorregar" pro
-- próximo tick fixo das 10h (até 24h de atraso do horário sorteado).
-- Troca pra rodar de hora em hora: ainda idempotente (sent_at evita
-- reenvio) e ainda respeita a janela de validade de cada mensagem.

select cron.unschedule('send-scheduled-push-daily');

select cron.schedule(
  'send-scheduled-push-hourly',
  '0 * * * *', -- a cada hora cheia
  $$
  select net.http_post(
    url := 'https://pwfbgcbchhtumvwjrlep.supabase.co/functions/v1/send-scheduled-push',
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

insert into public.push_campaign_queue (title, body, scheduled_at, expires_at) values
  ('👥 Chame a galera!', 'Você já usa o Control Frete e sabe como ele facilita a rotina. Convide outros motoristas e ganhe CF Coins por cada indicação — mais gente, mais benefícios pra você.', '2026-10-07T12:35:00Z', '2026-10-08T12:35:00Z'),
  ('💰 Seus CF Coins valem mais do que você imagina', 'A cada indicação ou ação no app, você acumula CF Coins. Em breve, eles vão virar descontos reais em assinaturas e parcerias. Comece a guardar agora!', '2026-10-10T19:50:00Z', '2026-10-11T19:50:00Z'),
  ('🧪 Você está no time de teste oficial', 'Obrigado por testar o Control Frete antes de todo mundo! Sua participação ajuda a gente a chegar mais forte na Play Store. Continue usando e nos conta o que achar.', '2026-10-14T14:20:00Z', '2026-10-15T14:20:00Z'),
  ('👥 Chame a galera!', 'Você já usa o Control Frete e sabe como ele facilita a rotina. Convide outros motoristas e ganhe CF Coins por cada indicação — mais gente, mais benefícios pra você.', '2026-10-17T22:05:00Z', '2026-10-18T22:05:00Z'),
  ('💰 Seus CF Coins valem mais do que você imagina', 'A cada indicação ou ação no app, você acumula CF Coins. Em breve, eles vão virar descontos reais em assinaturas e parcerias. Comece a guardar agora!', '2026-10-21T17:40:00Z', '2026-10-22T17:40:00Z'),
  ('🧪 Você está no time de teste oficial', 'Obrigado por testar o Control Frete antes de todo mundo! Sua participação ajuda a gente a chegar mais forte na Play Store. Continue usando e nos conta o que achar.', '2026-10-24T13:15:00Z', '2026-10-25T13:15:00Z'),
  ('👥 Chame a galera!', 'Você já usa o Control Frete e sabe como ele facilita a rotina. Convide outros motoristas e ganhe CF Coins por cada indicação — mais gente, mais benefícios pra você.', '2026-10-28T20:25:00Z', '2026-10-29T20:25:00Z'),
  ('💰 Seus CF Coins valem mais do que você imagina', 'A cada indicação ou ação no app, você acumula CF Coins. Em breve, eles vão virar descontos reais em assinaturas e parcerias. Comece a guardar agora!', '2026-10-31T15:50:00Z', '2026-11-01T15:50:00Z');

-- Fila de push agendados (campanha de transição pra Play Store). Guarda o
-- conteúdo de cada aviso + quando deve sair (scheduled_at) + até quando
-- ainda vale a pena mandar se o cron atrasar (expires_at) — evita mandar
-- um aviso "estamos evoluindo" com 5 dias de atraso se o cron falhar.
-- scheduled_at/expires_at nulos = rascunho, ainda não agendado.

create table if not exists public.push_campaign_queue (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  scheduled_at timestamptz,
  expires_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.push_campaign_queue enable row level security;

create policy "Admins can view push queue" on public.push_campaign_queue for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can insert push queue" on public.push_campaign_queue for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Admins can update push queue" on public.push_campaign_queue for update to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Conteúdo da campanha "transição pra Play Store". A primeira ("Trabalhando
-- por você") sai amanhã como um aviso solto contando que o app está em
-- evolução constante; as 3 seguintes são o ciclo formal de 2x por semana,
-- dentro dos próximos 10 dias, cada uma com 24h de validade. A "Já está na
-- Play Store!" foi deixada sem data de propósito — ela afirma algo que
-- ainda não é verdade; agende manualmente pelo botão de broadcast do painel
-- admin assim que o app estiver mesmo disponível na loja. As outras 2 ficam
-- como rascunho pra campanhas futuras.
insert into public.push_campaign_queue (title, body, scheduled_at, expires_at) values
  ('🛠️ Trabalhando por você', 'Seguimos melhorando o Control Frete toda semana, nos bastidores. Em breve, quando chegarmos à Play Store, seu app vai se atualizar sozinho — sem precisar baixar nada manualmente!', '2026-10-01T13:00:00Z', '2026-10-02T13:00:00Z'),
  ('🚀 O Control Frete está evoluindo!', 'Estamos preparando o aplicativo para instalação oficial pela Google Play Store. Em breve teremos novidades!', '2026-10-02T13:00:00Z', '2026-10-03T13:00:00Z'),
  ('📲 Vem novidade por aí!', 'O Control Frete está em transição para a Google Play Store. Assim que estiver disponível, avisaremos você!', '2026-10-06T13:00:00Z', '2026-10-07T13:00:00Z'),
  ('🔔 Atenção, usuário Control Frete', 'Estamos finalizando a transição do app para a Play Store. Continue utilizando normalmente. Em breve enviaremos novas informações.', '2026-10-09T13:00:00Z', '2026-10-10T13:00:00Z'),
  ('🟢 Já está na Play Store!', 'Temos uma novidade: o Control Frete já pode ser instalado pela Google Play Store. Atualize seu app e continue aproveitando todos os recursos!', null, null),
  ('🎉 Uma nova fase começou!', 'O Control Frete está chegando oficialmente à Google Play Store. Obrigado por fazer parte dessa evolução!', null, null),
  ('🚛 Você faz parte dessa história!', 'O Control Frete está chegando à Play Store. Em breve você receberá o aviso para instalar a versão oficial.', null, null),
  ('⚡ Novidade no Control Frete', 'Estamos preparando a versão oficial para a Google Play Store. Aguarde nosso próximo aviso!', null, null);

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'send-scheduled-push-daily',
  '0 13 * * *', -- 13:00 UTC = 10:00 no horário de Brasília
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

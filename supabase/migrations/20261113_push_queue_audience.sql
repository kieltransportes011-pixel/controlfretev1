-- Permite segmentar um aviso da fila de push por publico: 'all' (todo mundo,
-- comportamento de sempre) ou 'free' (so quem ainda nao e PRO - usado pros
-- avisos de upgrade intercalados com os anuncios de novidade, que nao fazem
-- sentido pra quem ja assina).
alter table public.push_campaign_queue
  add column if not exists audience text not null default 'all'
  check (audience in ('all', 'free', 'pro'));

-- Campanha de lancamento da v1.6 (Frota + Calculadora), intercalada com
-- avisos de upgrade pra quem ainda e Free.
insert into public.push_campaign_queue (title, body, scheduled_at, expires_at, audience) values
  ('🚛 Gestão de Frota chegou!', 'Agora você controla toda a frota pelo app: alertas de revisão, histórico por veículo e muito mais. Dá uma olhada!', '2026-11-17T13:00:00Z', '2026-11-18T13:00:00Z', 'all'),
  ('🔓 Libere a Gestão de Frota', 'Assinantes PRO já estão usando os alertas de revisão e o painel de lucro por caminhão. Vire PRO e libere tudo isso.', '2026-11-19T18:00:00Z', '2026-11-20T18:00:00Z', 'free'),
  ('⏰ Nunca mais esqueça a revisão', 'O Control Frete agora avisa sozinho quando um caminhão está chegando na hora da revisão — por KM ou por data.', '2026-11-20T17:00:00Z', '2026-11-21T17:00:00Z', 'all'),
  ('⭐ Por que motoristas viram PRO', 'Menos esquecimento, mais controle: quem é PRO usa o Control Frete sem limites. Veja os planos.', '2026-11-23T13:30:00Z', '2026-11-24T13:30:00Z', 'free'),
  ('💰 Veja o lucro de cada caminhão', 'Novo painel mostra quanto cada veículo da sua frota realmente rende: receita menos manutenção e combustível, automático.', '2026-11-24T12:30:00Z', '2026-11-25T12:30:00Z', 'all'),
  ('💳 Por menos de R$5 por mês', 'O plano anual PRO sai por R$ 4,17/mês. Descubra tudo que você libera sendo PRO.', '2026-11-26T19:00:00Z', '2026-11-27T19:00:00Z', 'free'),
  ('📍 Calculadora mais rápida', 'Ao digitar o endereço de coleta ou destino, o app já sugere e calcula a distância sozinho. Menos trabalho, menos erro.', '2026-11-27T14:00:00Z', '2026-11-28T14:00:00Z', 'all'),
  ('🎯 Já pensou ser PRO?', 'Gestão de Frota completa, sem limite de fretes, e muito mais. Dá uma olhada no que o PRO oferece.', '2026-11-30T14:30:00Z', '2026-12-01T14:30:00Z', 'free'),
  ('🔍 Tudo sobre seu caminhão, num só lugar', 'Clique num veículo da frota e veja KM atual, histórico de manutenção e quanto ele já rendeu em fretes.', '2026-12-01T16:00:00Z', '2026-12-02T16:00:00Z', 'all');

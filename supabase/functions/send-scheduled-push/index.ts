import { createClient } from 'npm:@supabase/supabase-js@2';

// Roda 1x por dia via pg_cron (ver migration correspondente). Varre a fila
// push_campaign_queue por avisos com scheduled_at já vencido, ainda dentro
// da validade (expires_at) e que nunca foram enviados, e dispara cada um
// via send-push-notification (broadcast pra todos os dispositivos).

Deno.serve(async (req) => {
  // Mesmo padrão de auth do check-due-bills: só o próprio pg_cron chama essa
  // função, usando a secret key dedicada ("controlfrete_1_0").
  const authHeader = req.headers.get('Authorization') ?? '';
  const bearerToken = authHeader.replace('Bearer ', '');
  const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
  const cronAuthKey = secretKeys['controlfrete_1_0'];

  if (!cronAuthKey || bearerToken !== cronAuthKey) {
    return new Response(JSON.stringify({ error: 'Não autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, cronAuthKey);
    const nowIso = new Date().toISOString();

    const { data: due, error } = await supabase
      .from('push_campaign_queue')
      .select('id, title, body')
      .is('sent_at', null)
      .not('scheduled_at', 'is', null)
      .lte('scheduled_at', nowIso)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    if (!due || due.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`;
    let sent = 0;

    for (const item of due) {
      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cronAuthKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ broadcast: true, title: item.title, body: item.body }),
      });

      if (res.ok) {
        await supabase.from('push_campaign_queue').update({ sent_at: new Date().toISOString() }).eq('id', item.id);
        sent++;
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

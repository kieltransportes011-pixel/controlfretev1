import { createClient } from 'npm:@supabase/supabase-js@2';

// Roda 1x por dia via pg_cron (ver migration correspondente). Varre as contas
// a pagar em aberto vencendo hoje ou amanhã e dispara um push por usuário
// (agrupado, pra não mandar uma notificação por conta se tiver várias).

function formatDateBR(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${d}/${m}`;
}

Deno.serve(async (req) => {
  // Só o próprio pg_cron chama essa função. A checagem usa uma secret key
  // dedicada ("controlfrete_1_0", guardada no Vault) em vez da SUPABASE_SERVICE_ROLE_KEY
  // "default" — essa última é usada por outras funções e não deve ser
  // reaproveitada aqui como credencial de autenticação de entrada.
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

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const { data: bills, error } = await supabase
      .from('contas_a_pagar')
      .select('user_id, description, due_date')
      .eq('status', 'aberto')
      .in('due_date', [todayStr, tomorrowStr]);

    if (error) throw error;

    if (!bills || bills.length === 0) {
      return new Response(JSON.stringify({ notified: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const byUser = new Map<string, typeof bills>();
    for (const bill of bills) {
      const list = byUser.get(bill.user_id) ?? [];
      list.push(bill);
      byUser.set(bill.user_id, list);
    }

    const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`;
    let notified = 0;

    for (const [userId, userBills] of byUser) {
      const title = userBills.length === 1 ? 'Conta a vencer' : `${userBills.length} contas a vencer`;
      const body =
        userBills.length === 1
          ? `"${userBills[0].description}" vence em ${formatDateBR(userBills[0].due_date)}.`
          : `Você tem ${userBills.length} contas vencendo hoje ou amanhã.`;

      const res = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cronAuthKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId, title, body }),
      });

      if (res.ok) notified++;
    }

    return new Response(JSON.stringify({ notified }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

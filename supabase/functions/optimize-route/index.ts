import { createClient } from 'npm:@supabase/supabase-js@2';

// Otimizador de rota (2-6 paradas): reordena paradas intermediárias pra
// achar o trajeto mais curto via Google Routes API (optimizeWaypointOrder).
// Pago com CF Coins em vez de virar feature de plano — ver comentário no
// débito abaixo sobre a ordem "só cobra se o Google responder com sucesso".

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COST = 8;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validar entrada antes de qualquer chamada externa ou de banco.
    const { stops } = await req.json();
    if (!Array.isArray(stops) || stops.length < 2 || stops.length > 6) {
      throw new Error('Informe de 2 a 6 endereços.');
    }
    const cleanStops: string[] = stops.map((s: unknown) => String(s ?? '').trim());
    if (cleanStops.some(s => s.length === 0)) {
      throw new Error('Todos os endereços precisam estar preenchidos.');
    }

    // 2. Autenticação (qualquer usuário logado, não é feature PRO).
    const authHeader = req.headers.get('Authorization') ?? '';
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autenticado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Cliente privilegiado (chave dedicada) pra ler/debitar CF Coins
    // bypassando RLS — mesmo padrão do mercado-pago-webhook.
    const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      secretKeys['controlfrete_1_0'] ?? ''
    );

    // 4. Checa saldo ANTES de chamar o Google — não vale a pena gastar a
    // chamada se o usuário não tem CF suficiente.
    const { data: wallet } = await adminClient
      .from('cf_wallet')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();
    const balance = wallet?.balance ?? 0;

    if (balance < COST) {
      return new Response(
        JSON.stringify({ error: 'insufficient_balance', balance, cost: COST }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Chama a Routes API com otimização de paradas intermediárias.
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY não configurado.');
    }

    const origin = cleanStops[0];
    const destination = cleanStops[cleanStops.length - 1];
    const middleStops = cleanStops.slice(1, -1);
    const intermediates = middleStops.map((address) => ({ address }));

    const body: Record<string, unknown> = {
      origin: { address: origin },
      destination: { address: destination },
      travelMode: 'DRIVE',
    };
    if (intermediates.length > 0) {
      body.intermediates = intermediates;
      body.optimizeWaypointOrder = true;
    }

    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // Mínimo necessário: distância + índice otimizado das paradas do meio.
        // Sem "duration" de propósito, pra não subir o nível de preço à toa.
        'X-Goog-FieldMask': 'routes.distanceMeters,routes.optimizedIntermediateWaypointIndex',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || !data.routes?.[0]) {
      console.error('Routes API error:', data);
      // Erro do Google não vaza a chave — repassar ajuda a diagnosticar.
      throw new Error(data.error?.message ?? 'Não foi possível otimizar a rota entre esses endereços.');
    }

    // Reconstrói a ordem completa: origem fixa, meio reordenado, destino fixo.
    const optimizedMiddleIndexes: number[] = data.routes[0].optimizedIntermediateWaypointIndex
      ?? middleStops.map((_: string, i: number) => i);
    const optimizedOrder = [
      0,
      ...optimizedMiddleIndexes.map((i: number) => i + 1),
      cleanStops.length - 1,
    ];
    const totalDistanceKm = Math.round((data.routes[0].distanceMeters / 1000) * 10) / 10;

    // 6. SÓ chega aqui se o Google respondeu com sucesso — é aqui que debita.
    // Se o Google tivesse falhado, já teria lançado erro acima e nada seria
    // cobrado.
    const { error: debitError } = await adminClient.rpc('award_cf_coins', {
      p_user_id: user.id,
      p_amount: -COST,
      p_reason: 'Otimização de rota',
    });
    if (debitError) {
      // O valor já foi entregue ao usuário (a rota já foi calculada); um erro
      // de debito aqui não deve bloquear a resposta, só fica registrado pra
      // investigar depois.
      console.error('Falha ao debitar CF Coins após otimização bem-sucedida:', debitError);
    }

    const { data: walletAfter } = await adminClient
      .from('cf_wallet')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    return new Response(
      JSON.stringify({
        optimized_order: optimizedOrder,
        total_distance_km: totalDistanceKm,
        cf_cost: COST,
        cf_balance_after: walletAfter?.balance ?? (balance - COST),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

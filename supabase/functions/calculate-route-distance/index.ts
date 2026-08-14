import { createClient } from 'npm:@supabase/supabase-js@2';

// Calcula a distância rodoviária entre origem e destino via Google Routes
// API. Fica no backend pra manter a chave do Google fora do app — client-side
// ela ficaria exposta no bundle/tráfego de rede.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Só usuários autenticados (qualquer um, não precisa ser admin).
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

    const { origin, destination } = await req.json();
    if (!origin || !destination) {
      throw new Error('Origem e destino são obrigatórios.');
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY não configurado.');
    }

    const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // Field mask mínimo (só distância) mantém no nível de preço mais
        // barato (Basic) da Routes API.
        'X-Goog-FieldMask': 'routes.distanceMeters',
      },
      body: JSON.stringify({
        origin: { address: origin },
        destination: { address: destination },
        travelMode: 'DRIVE',
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.routes?.[0]) {
      console.error('Routes API error:', data);
      throw new Error('Não foi possível calcular a rota entre esses endereços.');
    }

    const distanceKm = Math.round((data.routes[0].distanceMeters / 1000) * 10) / 10;

    return new Response(JSON.stringify({ distance_km: distanceKm }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

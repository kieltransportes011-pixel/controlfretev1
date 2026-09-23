import { createClient } from 'npm:@supabase/supabase-js@2';

// Função genérica de envio de push via FCM (HTTP v1 API).
// Reaproveitada pelas próximas fases (conta a vencer, pagamento confirmado),
// não é exclusiva do fluxo de suporte — por isso recebe user_id/title/body
// em vez de um "tipo" fixo de notificação.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function base64url(input: string | ArrayBuffer): string {
  const bytes = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : new Uint8Array(input);
  let str = '';
  bytes.forEach((b) => { str += String.fromCharCode(b); });
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Troca a chave privada da service account por um access token OAuth2,
// via o fluxo "JWT bearer" do Google (sem depender de libs Node no Deno).
async function getAccessToken(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;

  const pem = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const keyBytes = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );

  const jwt = `${unsigned}.${base64url(signature)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await res.json();
  if (!res.ok || !tokenData.access_token) {
    throw new Error(`Falha ao obter access token do Google: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

async function sendToToken(
  accessToken: string,
  projectId: string,
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        ...(data ? { data } : {}),
      },
    }),
  });
  const result = await res.json();
  return { ok: res.ok, result };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Só dois tipos de chamador são aceitos: (1) o próprio backend/cron/webhook,
    // usando a service role key direto, ou (2) um admin autenticado (ex: painel
    // respondendo um chamado). Qualquer outro usuário autenticado não pode mandar
    // push arbitrário pra outro user_id.
    const authHeader = req.headers.get('Authorization') ?? '';
    const bearerToken = authHeader.replace('Bearer ', '');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
    const cronAuthKey = secretKeys['controlfrete_1_0'];
    const isServiceRole = bearerToken === serviceRoleKey || (!!cronAuthKey && bearerToken === cronAuthKey);

    if (!isServiceRole) {
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

      const { data: callerProfile } = await anonClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (callerProfile?.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Acesso restrito.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { user_id, user_ids, broadcast, title, body, data } = await req.json();

    if (!title || !body) {
      throw new Error('title e body são obrigatórios.');
    }
    if (!user_id && !broadcast && (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0)) {
      throw new Error('Informe user_id, user_ids ou broadcast.');
    }
    // Broadcast é uma ação de admin (o próprio check de role acima já barra
    // qualquer chamador não-admin/não-serviço antes de chegar aqui).

    const serviceAccountRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!serviceAccountRaw) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT não configurado.');
    }
    const serviceAccount = JSON.parse(serviceAccountRaw);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      cronAuthKey || serviceRoleKey
    );

    let tokensQuery = supabase.from('push_tokens').select('token, user_id');
    if (broadcast) {
      // sem filtro: todos os dispositivos registrados
    } else if (user_ids) {
      tokensQuery = tokensQuery.in('user_id', user_ids);
    } else {
      tokensQuery = tokensQuery.eq('user_id', user_id);
    }
    const { data: tokens, error: tokensError } = await tokensQuery;

    if (tokensError) throw tokensError;

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, total: 0, message: 'Nenhum dispositivo registrado para push.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await getAccessToken(serviceAccount);

    const results = await Promise.all(
      tokens.map((t) => sendToToken(accessToken, serviceAccount.project_id, t.token, title, body, data))
    );

    // Tokens inválidos/desinstalados: o FCM responde com UNREGISTERED — limpa da tabela.
    const deadTokens = tokens
      .filter((_, i) => {
        const r = results[i];
        return !r.ok && JSON.stringify(r.result).includes('UNREGISTERED');
      })
      .map((t) => t.token);

    if (deadTokens.length > 0) {
      await supabase.from('push_tokens').delete().in('token', deadTokens);
    }

    const sent = results.filter((r) => r.ok).length;
    return new Response(
      // Pra um único destinatário mantém "results" detalhado (usado pelo fluxo
      // de resposta de ticket); em broadcast/multi só o resumo, pra não gerar
      // uma resposta gigante com centenas de resultados por token.
      JSON.stringify(
        broadcast || user_ids
          ? { sent, total: tokens.length }
          : { sent, results }
      ),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

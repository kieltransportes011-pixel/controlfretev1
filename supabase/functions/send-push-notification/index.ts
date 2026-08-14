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
    const isServiceRole = bearerToken === serviceRoleKey;

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

    const { user_id, title, body, data } = await req.json();

    if (!user_id || !title || !body) {
      throw new Error('user_id, title e body são obrigatórios.');
    }

    const serviceAccountRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!serviceAccountRaw) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT não configurado.');
    }
    const serviceAccount = JSON.parse(serviceAccountRaw);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      serviceRoleKey
    );

    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', user_id);

    if (tokensError) throw tokensError;

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: 'Usuário sem dispositivos registrados para push.' }),
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

    return new Response(
      JSON.stringify({ sent: results.filter((r) => r.ok).length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

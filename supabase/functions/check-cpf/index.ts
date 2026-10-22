import { createClient } from 'npm:@supabase/supabase-js@2';

// Publico (sem login), chamado durante o cadastro pra avisar se um CPF ja
// esta em uso. Fica atras de rate limit por IP porque a RPC
// check_cpf_exists sozinha, sem essa camada, permitia qualquer pessoa
// descobrir se um CPF especifico tem conta no Control Frete so testando
// numeros - um vazamento de privacidade. A RPC teve o EXECUTE revogado de
// anon/authenticated (ver migration correspondente); so essa function, com
// a chave privilegiada, consegue chama-la agora.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_ATTEMPTS = 10;
const WINDOW_MINUTES = 60;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { cpf } = await req.json();
    if (!cpf) throw new Error('CPF é obrigatório.');

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || req.headers.get('cf-connecting-ip')
      || 'unknown';

    const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      secretKeys['controlfrete_1_0']
    );

    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('cpf_check_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', windowStart);

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas. Tente novamente mais tarde.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabase.from('cpf_check_attempts').insert({ ip_address: ip });

    const { data: exists, error } = await supabase.rpc('check_cpf_exists', { p_cpf: cpf });
    if (error) throw error;

    return new Response(
      JSON.stringify({ exists: !!exists }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

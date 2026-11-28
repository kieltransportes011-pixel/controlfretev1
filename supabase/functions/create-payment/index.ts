// Desativada em 28/11/2026.
// Esta função antiga aceitava o valor enviado pelo próprio cliente, o que permitia
// pagar qualquer valor e virar PRO. O app usa somente a create-checkout, que define
// o preço no servidor (_shared/pricing.ts).
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve((req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }
    return new Response(
        JSON.stringify({ error: 'Esta forma de pagamento foi desativada. Use a assinatura pelo app.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 410 },
    );
});


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MercadoPagoConfig, Payment } from 'npm:mercadopago';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Access Token
const MP_ACCESS_TOKEN = 'APP_USR-5220193210096311-122719-be527becb762558ba471f0fcdaa4fdd5-2034012095';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const topic = url.searchParams.get('topic') || url.searchParams.get('type');
        const id = url.searchParams.get('id') || url.searchParams.get('data.id');

        // Mercado Pago webhooks send id in query params or body. 
        // We'll handle the standard notification format.
        const body = await req.json().catch(() => ({}));
        const paymentId = body.data?.id || body.id || id;
        const type = body.type || topic;

        console.log("Webhook Received:", { type, paymentId });

        if (type === 'payment' && paymentId) {
            const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
            const payment = new Payment(client);

            // Verify payment status with MP
            const paymentData = await payment.get({ id: paymentId });

            if (paymentData.status === 'approved') {
                const userId = paymentData.metadata.user_id;

                if (userId) {
                    // Initialize Supabase Admin Client
                    const supabase = createClient(
                        Deno.env.get('SUPABASE_URL') ?? '',
                        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                    );

                    const premiumUntil = new Date();
                    premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);

                    await supabase.from('profiles').update({
                        is_premium: true,
                        plano: 'pro',
                        status_assinatura: 'ativa',
                        premium_until: premiumUntil.toISOString(),
                        last_payment_id: paymentId.toString()
                    }).eq('id', userId);

                    console.log(`User ${userId} upgraded to PRO.`);
                }
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        );
    }
});

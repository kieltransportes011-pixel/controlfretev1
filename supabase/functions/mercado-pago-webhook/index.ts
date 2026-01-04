
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MercadoPagoConfig, Payment } from 'npm:mercadopago';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Access Token (with Env fallback)
const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') || 'APP_USR-5220193210096311-122719-be527becb762558ba471f0fcdaa4fdd5-2034012095';

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const topic = url.searchParams.get('topic') || url.searchParams.get('type');
        const id = url.searchParams.get('id') || url.searchParams.get('data.id');

        // Handle body if present
        const body = await req.json().catch(() => ({}));
        const paymentId = body.data?.id || body.id || id;
        const type = body.type || topic;

        console.log("Webhook Received:", { type, paymentId });

        if (type === 'payment' && paymentId) {
            const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
            const payment = new Payment(client);

            // Verify payment status with MP
            try {
                const paymentData = await payment.get({ id: paymentId });
                console.log(`Payment Data Retrieved. Status: ${paymentData.status}, Ref: ${paymentData.external_reference}`);

                if (paymentData.status === 'approved') {
                    // We utilize external_reference as standard for User ID in Checkout Pro
                    // Fallback to metadata if external_reference is missing (legacy support)
                    const userId = paymentData.external_reference || paymentData.metadata?.user_id;

                    if (userId) {
                        // Initialize Supabase Admin Client
                        const supabase = createClient(
                            Deno.env.get('SUPABASE_URL') ?? '',
                            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                        );

                        const premiumUntil = new Date();
                        premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);

                        const { error } = await supabase.from('profiles').update({
                            is_premium: true,
                            plano: 'pro',
                            status_assinatura: 'ativa',
                            premium_until: premiumUntil.toISOString(),
                            last_payment_id: paymentId.toString()
                        }).eq('id', userId);

                        if (error) {
                            console.error("Database Update Error:", error);
                        } else {
                            console.log(`User ${userId} successfully upgraded to PRO (Payment ${paymentId}).`);
                        }
                    } else {
                        console.error("No User ID found in payment reference/metadata.");
                    }
                }
            } catch (mpError) {
                console.error("Mercado Pago Lookup Error:", mpError);
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Webhook Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        );
    }
});


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
                console.log(`Payment Status: ${paymentData.status}, Ref: ${paymentData.external_reference}`);

                const paymentStatus = paymentData.status;
                const userId = paymentData.external_reference || paymentData.metadata?.user_id;

                if (!userId) {
                    console.error("No User ID found in payment reference/metadata.");
                    return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
                }

                // Initialize Supabase Admin Client
                const supabase = createClient(
                    Deno.env.get('SUPABASE_URL') ?? '',
                    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                );

                // 1. Idempotency Check & History Log
                // Check if this payment is already recorded as approved in HISTORY
                const { data: existingPayment } = await supabase
                    .from('payment_history')
                    .select('status, user_id')
                    .eq('payment_id', paymentId.toString())
                    .single();

                if (existingPayment?.status === 'approved') {
                    console.log(`Payment ${paymentId} already processed (Status: Approved). Ensuring Profile is Up-to-Date.`);
                    // We DO NOT return here. We allow the profile update to run again to "heal" any inconsistencies.
                }

                // 2. Upsert Payment Record into History
                const { error: paymentError } = await supabase
                    .from('payment_history')
                    .upsert({
                        payment_id: paymentId.toString(),
                        user_id: userId,
                        amount: paymentData.transaction_amount,
                        status: paymentStatus,
                        payment_method: paymentData.payment_method_id,
                        processed_at: new Date().toISOString(),
                        metadata: paymentData
                    }, { onConflict: 'payment_id' });

                if (paymentError) {
                    console.error("Error logging payment history:", paymentError);
                }

                // 3. Update PRO Profile
                if (paymentStatus === 'approved') {
                    const premiumUntil = new Date();
                    premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);

                    const { data: updatedProfile, error: updateError } = await supabase
                        .from('profiles')
                        .update({
                            is_premium: true,
                            plano: 'pro',
                            status_assinatura: 'ativa',
                            premium_until: premiumUntil.toISOString(),
                            last_payment_id: paymentId.toString()
                        })
                        .eq('id', userId)
                        .select();

                    if (updateError) {
                        console.error("Database Update Error:", updateError);
                    } else if (!updatedProfile || updatedProfile.length === 0) {
                        // Profile missing? Create one!
                        console.log("Profile missing for user. Creating new PRO profile...");
                        const { error: insertError } = await supabase.from('profiles').insert({
                            id: userId,
                            email: paymentData.payer?.email || '',
                            is_premium: true,
                            plano: 'pro',
                            status_assinatura: 'ativa',
                            premium_until: premiumUntil.toISOString(),
                            last_payment_id: paymentId.toString(),
                            created_at: new Date().toISOString()
                        });

                        if (insertError) console.error("Error creating missing profile:", insertError);
                        else console.log(`SUCCESS: Created and Upgraded User ${userId} to PRO ANUAL.`);
                    } else {
                        console.log(`SUCCESS: User ${userId} upgraded to PRO ANUAL (Payment ${paymentId}).`);
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

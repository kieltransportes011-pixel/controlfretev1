
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Fetch approved payments from history that might have been missed or need check
        // Actually, the user wants: "Consult approved payments, validate if user is FREE, reprocess".

        // We can fetch the last 50 approved payments.
        const { data: payments, error: paymentsError } = await supabase
            .from('payment_history')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false })
            .limit(50);

        if (paymentsError) throw paymentsError;

        const results = [];

        for (const payment of payments) {
            const userId = payment.user_id;

            // Check user status
            const { data: user, error: userError } = await supabase
                .from('profiles')
                .select('is_premium, plano')
                .eq('id', userId)
                .single();

            if (userError) {
                console.error(`Error fetching profile ${userId}:`, userError);
                continue;
            }

            if (!user.is_premium || user.plano !== 'pro') {
                console.log(`User ${userId} found with APPROVED payment but FREE plan. Fix it.`);

                // Fix User
                const premiumUntil = new Date();
                premiumUntil.setFullYear(premiumUntil.getFullYear() + 1);

                const { error: updateError } = await supabase.from('profiles').update({
                    is_premium: true,
                    plano: 'pro',
                    status_assinatura: 'ativa',
                    premium_until: premiumUntil.toISOString(),
                    last_payment_id: payment.payment_id
                }).eq('id', userId);

                if (updateError) {
                    results.push({ userId, status: 'failed', error: updateError.message });
                } else {
                    results.push({ userId, status: 'repaired' });
                }
            } else {
                results.push({ userId, status: 'ok' });
            }
        }

        return new Response(
            JSON.stringify({ message: "Reprocessing complete", results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
        );
    }
});

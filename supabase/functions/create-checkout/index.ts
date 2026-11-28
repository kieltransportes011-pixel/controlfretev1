
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MercadoPagoConfig, Preference } from 'npm:mercadopago';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCheckoutItem } from '../_shared/pricing.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Access Token
const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!;

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Debug logging
        console.log("Function invoked");

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

        if (!supabaseUrl || !supabaseAnonKey) {
            console.error("Missing Env Vars: SUPABASE_URL or SUPABASE_ANON_KEY");
            throw new Error('Configuration Error: Missing Supabase Environment Variables');
        }

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization Header');
        }

        // Create Client
        const supabase = createClient(
            supabaseUrl,
            supabaseAnonKey,
            { global: { headers: { Authorization: authHeader } } }
        );

        // Get User
        const {
            data: { user },
            error: userError
        } = await supabase.auth.getUser();

        if (userError) {
            console.error("Supabase Auth Error:", JSON.stringify(userError));
            throw new Error('Supabase Auth Failed: ' + userError.message);
        }

        if (!user) {
            console.error("User is null after auth.getUser()");
            throw new Error('User not found');
        }

        const reqData = await req.json().catch(() => ({}));
        const payerEmail = reqData.email || user.email;
        const planType = reqData.plan || 'annual_promo'; // Default to promo for now

        console.log(`Creating Preference for User: ${user.id} (${payerEmail}) - Plan: ${planType}`);

        const client = new MercadoPagoConfig({
            accessToken: MP_ACCESS_TOKEN,
            options: { timeout: 10000 }
        });

        const preference = new Preference(client);

        const notification_url = `${supabaseUrl}/functions/v1/mercado-pago-webhook`;
        const origin = req.headers.get('origin') || 'http://localhost:5173';

        // O preço (inclusive o da Black Friday) sai de _shared/pricing.ts.
        // Esse valor precisa bater com o que é exibido no Paywall/LandingPage
        // (utils/blackFriday.ts) — foi daqui que saiu o bug de uma venda ter
        // cobrado R$ 19,99 em vez do valor anunciado.
        const item = getCheckoutItem(planType);

        const body = {
            items: [item],
            // Payer removed to allow Guest Checkout / Full manual entry
            // This prevents "invalid email" errors if the fallback is rejected
            back_urls: {
                success: `${origin}/?payment=success`,
                failure: `${origin}/?payment=failure`,
                pending: `${origin}/?payment=pending`
            },
            auto_return: 'approved',
            external_reference: user.id,
            metadata: {
                user_id: user.id,
                plan: item.id === 'pro_monthly' ? 'monthly' : 'annual'
            },
            notification_url: notification_url
        };

        console.log("Preference Body MINIMAL:", JSON.stringify(body));

        const response = await preference.create({ body });
        console.log("Preference Created:", response.id);
        console.log("Init Point:", response.init_point);

        return new Response(
            JSON.stringify({
                id: response.id,
                init_point: response.init_point,
                sandbox_init_point: response.sandbox_init_point
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );

    } catch (error) {
        console.error("Create Checkout Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        );
    }
});


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MercadoPagoConfig, Preference } from 'npm:mercadopago';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Access Token
const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') || 'APP_USR-5220193210096311-122719-be527becb762558ba471f0fcdaa4fdd5-2034012095';

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

        const supabase = createClient(
            supabaseUrl,
            supabaseAnonKey,
            { global: { headers: { Authorization: authHeader } } }
        );

        const {
            data: { user },
            error: userError
        } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error("Auth Error:", userError);
            throw new Error('User not found or unauthorized');
        }

        const reqData = await req.json().catch(() => ({}));
        const payerEmail = reqData.email || user.email;

        console.log(`Creating Preference for User: ${user.id} (${payerEmail})`);

        const client = new MercadoPagoConfig({
            accessToken: MP_ACCESS_TOKEN,
            options: { timeout: 10000 }
        });

        const preference = new Preference(client);

        const notification_url = `${supabaseUrl}/functions/v1/mercado-pago-webhook`;
        const origin = req.headers.get('origin') || 'http://localhost:5173';

        const body = {
            items: [
                {
                    id: 'pro_annual',
                    title: 'Assinatura Anual Control Frete Pro',
                    description: 'Acesso completo - 1 Ano',
                    quantity: 1,
                    currency_id: 'BRL',
                    unit_price: 59.99
                }
            ],
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
                user_id: user.id
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

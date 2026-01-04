
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

        const { email } = await req.json();
        const payerEmail = email || user.email;

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
                    description: 'Acesso completo a todos os recursos por 1 ano',
                    quantity: 1,
                    currency_id: 'BRL',
                    unit_price: 2.00
                }
            ],
            payer: {
                email: payerEmail,
                name: 'Usuario',
                surname: 'ControlFrete'
            },
            back_urls: {
                success: `${origin}/?payment=success`,
                failure: `${origin}/?payment=failure`,
                pending: `${origin}/?payment=pending`
            },
            auto_return: 'approved',
            external_reference: user.id,
            payment_methods: {
                excluded_payment_methods: [],
                excluded_payment_types: []
            },
            notification_url: notification_url,
            statement_descriptor: 'CONTROLFRETE'
        };

        const response = await preference.create({ body });
        console.log("Preference Created:", response.id);

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

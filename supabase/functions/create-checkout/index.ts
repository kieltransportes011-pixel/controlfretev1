
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
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

        const supabase = createClient(
            supabaseUrl,
            supabaseKey,
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('User not found');
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
        // For local dev, notification_url must be publicly accessible or it won't work.
        // In production, Supabase Edge Functions URL is public.

        const origin = req.headers.get('origin') || 'http://localhost:5173'; // Fallback for testing

        const body = {
            items: [
                {
                    id: 'pro_annual',
                    title: 'Assinatura Anual Control Frete Pro',
                    description: 'Acesso completo a todos os recursos por 1 ano',
                    quantity: 1,
                    currency_id: 'BRL',
                    unit_price: 49.99
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
            external_reference: user.id, // CRITICAL: Linking payment to User ID
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

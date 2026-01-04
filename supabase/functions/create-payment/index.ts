
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MercadoPagoConfig, Payment } from 'npm:mercadopago';
import { createClient } from 'jsr:@supabase/supabase-js@2';

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
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            throw new Error('User not found');
        }

        const { email } = await req.json();

        const client = new MercadoPagoConfig({
            accessToken: 'APP_USR-5220193210096311-122719-be527becb762558ba471f0fcdaa4fdd5-2034012095',
            options: { timeout: 10000 }
        });

        const payment = new Payment(client);

        const body = {
            transaction_amount: 49.99,
            description: 'Assinatura Anual Control Frete Pro',
            payment_method_id: 'pix',
            payer: {
                email: email || user.email,
                first_name: 'Usuario',
                last_name: 'ControlFrete'
            },
            metadata: {
                user_id: user.id
            },
            notification_url: 'https://vsujlbpfilhcnqfkeorr.supabase.co/functions/v1/mercado-pago-webhook'
            // Note: In local dev, webhooks won't reach localhost. 
            // User needs to deploy or tunnel. For now we set the standard URL structure.
        };

        const response = await payment.create({ body });

        return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        );
    }
});

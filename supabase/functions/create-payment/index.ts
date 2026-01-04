
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MercadoPagoConfig, Payment } from 'npm:mercadopago';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

        const reqData = await req.json();
        const email = reqData.email || user.email;

        console.log(`Initializing Payment for User: ${user.id} (${email})`);

        const client = new MercadoPagoConfig({
            accessToken: MP_ACCESS_TOKEN,
            options: { timeout: 10000 }
        });

        const payment = new Payment(client);

        const notification_url = `${supabaseUrl}/functions/v1/mercado-pago-webhook`;
        console.log(`Webhook URL: ${notification_url}`);

        const body = {
            transaction_amount: 49.99,
            description: 'Assinatura Anual Control Frete Pro',
            payment_method_id: 'pix',
            payer: {
                email: email,
                first_name: 'Usuario',
                last_name: 'ControlFrete'
            },
            metadata: {
                user_id: user.id
            },
            notification_url: notification_url
        };

        const response = await payment.create({ body });
        console.log("Payment Created Successfully:", response.id);

        return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );

    } catch (error) {
        console.error("Create Payment Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        );
    }
});

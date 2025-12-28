import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { MercadoPagoConfig, Payment } from 'npm:mercadopago'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_ACCESS_TOKEN = "APP_USR-5220193210096311-122719-be527becb762558ba471f0fcdaa4fdd5-2034012095"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Auth Check
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        const { formData, userId } = await req.json()

        // 2. Setup Mercado Pago
        const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
        const payment = new Payment(client);

        // 3. Create Payment
        const paymentBody: any = {
            transaction_amount: Number(formData.transaction_amount),
            description: "Assinatura Profissional - Control Frete",
            payment_method_id: String(formData.payment_method_id),
            payer: {
                email: String(formData.payer.email),
            },
            metadata: {
                user_id: user.id
            }
        };

        if (formData.token) {
            paymentBody.token = String(formData.token);
            paymentBody.installments = Number(formData.installments || 1);
            paymentBody.issuer_id = formData.issuer_id ? String(formData.issuer_id) : undefined;
        }

        const response = await payment.create({
            body: paymentBody,
            requestOptions: { idempotencyKey: `pay_${user.id}_${Date.now()}` }
        });

        const status = String(response.status);
        const paymentId = String(response.id);

        // 4. Handle Success
        if (status === "approved") {
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            await supabaseAdmin.from('profiles').update({
                is_premium: true,
                premium_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                last_payment_id: paymentId
            }).eq('id', user.id);

            return new Response(JSON.stringify({ status: "success", paymentId }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // 5. Handle Pending (Pix)
        if (status === "pending" || status === "in_process") {
            const result: any = { status: "pending", paymentId, paymentMethod: String(formData.payment_method_id) };

            if (formData.payment_method_id === "pix") {
                result.pixData = {
                    qrCode: response.point_of_interaction?.transaction_data?.qr_code,
                    qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64
                };
            }

            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // 6. Handle Error
        return new Response(JSON.stringify({ status: "error", message: response.status_detail }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

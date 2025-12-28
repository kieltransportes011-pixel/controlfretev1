import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { MercadoPagoConfig, Payment } from 'npm:mercadopago'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN') ?? "APP_USR-5220193210096311-122719-be527becb762558ba471f0fcdaa4fdd5-2034012095";

        // 1. Auth Check
        const supabaseClient = createClient(
            supabaseUrl,
            supabaseAnonKey,
            { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } }
        )

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

        if (authError || !user) {
            console.error("Auth Error:", authError);
            return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders });
        }

        const body = await req.json();
        const { formData } = body;

        console.log("Processing payment for user:", user.email, "Method:", formData.payment_method_id);

        // 2. Setup Mercado Pago
        const client = new MercadoPagoConfig({ accessToken: mpAccessToken });
        const payment = new Payment(client);

        // 3. Create Payment Body
        const paymentBody: any = {
            transaction_amount: Number(formData.transaction_amount || 49.90),
            description: "Assinatura Profissional - Control Frete",
            payment_method_id: String(formData.payment_method_id),
            payer: {
                email: String(formData.payer?.email || user.email),
                identification: formData.payer?.identification ? {
                    type: String(formData.payer.identification.type),
                    number: String(formData.payer.identification.number)
                } : undefined,
                first_name: formData.payer?.first_name || "Usuario",
                last_name: formData.payer?.last_name || "Control Frete"
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

        // 4. Create Payment
        const response = await payment.create({
            body: paymentBody,
            requestOptions: { idempotencyKey: `pay_${user.id}_${Date.now()}` }
        });

        console.log("MP Response Status:", response.status);

        const status = String(response.status);
        const paymentId = String(response.id);

        // 5. Handle Success
        if (status === "approved") {
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

            const { error: updateError } = await supabaseAdmin.from('profiles').update({
                is_premium: true,
                premium_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                last_payment_id: paymentId
            }).eq('id', user.id);

            if (updateError) {
                console.error("Database Update Error:", updateError);
                // We still returned success because payment was approved, but warned in logs
            }

            return new Response(JSON.stringify({ status: "success", paymentId }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // 6. Handle Pending (Pix)
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

        // 7. Handle Other MP Statuses (rejected, nullified, etc.)
        return new Response(JSON.stringify({
            status: "error",
            message: response.status_detail || "Pagamento recusado.",
            mp_status: status
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })

    } catch (error: any) {
        console.error("Global Catch Error:", error);
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

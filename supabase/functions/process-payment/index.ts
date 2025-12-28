import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { MercadoPagoConfig, Payment } from 'npm:mercadopago'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// You should set this in Supabase Secrets
// supabase secrets set MP_ACCESS_TOKEN=APP_USR-...
const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') || "APP_USR-5220193210096311-122719-be527becb762558ba471f0fcdaa4fdd5-2034012095"

serve(async (req) => {
    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Auth Check (Supabase Auth)
        // Create a Supabase client with the Auth context of the logged in user
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Get the user from the token
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        const { formData, userId } = await req.json()

        // 2. Setup Mercado Pago
        const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
        const payment = new Payment(client);

        // 3. Create Payment Body
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

            // Identification required for Card payments
            if (formData.payer && formData.payer.identification) {
                paymentBody.payer.identification = {
                    type: String(formData.payer.identification.type),
                    number: String(formData.payer.identification.number)
                }
            }
        }

        console.log("Creating payment with body:", JSON.stringify(paymentBody));

        const response = await payment.create({
            body: paymentBody,
            requestOptions: { idempotencyKey: `pay_${user.id}_${Date.now()}` }
        });

        const status = String(response.status);
        const paymentId = String(response.id);

        // 4. Handle Success
        if (status === "approved") {
            // Use Service Role to write to profiles (bypassing RLS if necessary, or just ensuring stability)
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

            const { error: updateError } = await supabaseAdmin.from('profiles').update({
                is_premium: true,
                premium_until: oneYearFromNow.toISOString(),
                last_payment_id: paymentId
            }).eq('id', user.id);

            if (updateError) {
                console.error("Error updating profile:", updateError);
                throw new Error("Payment approved but failed to update profile");
            }

            return new Response(JSON.stringify({ status: "success", paymentId }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // 5. Handle Pending (Pix/Boleto)
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
        console.error("Function error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

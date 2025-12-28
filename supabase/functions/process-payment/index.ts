import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { MercadoPagoConfig, Payment, Preference } from 'npm:mercadopago'
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
        const { action, formData } = body;

        const client = new MercadoPagoConfig({ accessToken: mpAccessToken });

        // NOVO FLOW: CHECKOUT PRO (LINK DE PAGAMENTO)
        if (action === 'create-preference') {
            console.log("Creating preference for:", user.email);
            const preference = new Preference(client);
            const origin = req.headers.get('origin') || 'http://localhost:5173';

            const result = await preference.create({
                body: {
                    items: [
                        {
                            id: 'PRO-ANNUAL',
                            title: 'Assinatura Profissional - Control Frete',
                            quantity: 1,
                            unit_price: 49.90,
                            currency_id: 'BRL'
                        }
                    ],
                    payer: {
                        email: user.email,
                    },
                    metadata: {
                        user_id: user.id
                    },
                    back_urls: {
                        success: `${origin}?payment=success`,
                        failure: `${origin}?payment=failure`,
                        pending: `${origin}?payment=pending`
                    },
                    auto_return: 'approved'
                }
            });

            return new Response(JSON.stringify({ checkoutUrl: result.init_point }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // FLOW BASE/BRICK: PROCESSAMENTO DIRETO
        const payment = new Payment(client);
        const paymentBody: any = {
            transaction_amount: Number(formData?.transaction_amount || 49.90),
            description: "Assinatura Profissional - Control Frete",
            payment_method_id: String(formData?.payment_method_id),
            payer: {
                email: String(formData?.payer?.email || user.email),
                identification: formData?.payer?.identification ? {
                    type: String(formData.payer.identification.type),
                    number: String(formData.payer.identification.number)
                } : undefined,
                first_name: formData?.payer?.first_name || "Usuario",
                last_name: formData?.payer?.last_name || "Control Frete"
            },
            metadata: {
                user_id: user.id
            }
        };

        if (formData?.token) {
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

        if (status === "approved") {
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

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

        if (status === "pending" || status === "in_process") {
            const result: any = { status: "pending", paymentId, paymentMethod: String(formData?.payment_method_id) };
            if (formData?.payment_method_id === "pix") {
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

        return new Response(JSON.stringify({ status: "error", message: response.status_detail }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })

    } catch (error: any) {
        console.error("Global Catch Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { MercadoPagoConfig, Payment, Preference } from 'npm:mercadopago'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Manuseio de CORS pre-flight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // O Supabase injeta estas variáveis automaticamente na Edge Function
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN') ?? "APP_USR-5220193210096311-122719-be527becb762558ba471f0fcdaa4fdd5-2034012095";

        // Inicializa cliente admin para verificações se necessário
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Pega o usuário logado via header de autorização
        const authHeader = req.headers.get('Authorization')!;
        const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            console.error("Auth helper error:", authError);
            return new Response(JSON.stringify({ error: 'Sessão expirada. Entre novamente.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401
            });
        }

        const body = await req.json();
        const { action, formData } = body;

        const client = new MercadoPagoConfig({ accessToken: mpAccessToken });

        // MÉTODO 1: GERAR LINK DE PAGAMENTO (CHECKOUT PRO)
        if (action === 'create-preference') {
            console.log("Gerando link para:", user.email);
            const preference = new Preference(client);
            const origin = req.headers.get('origin') || 'http://localhost:5173';

            const result = await preference.create({
                body: {
                    items: [
                        {
                            id: 'PRO-ANNUAL',
                            title: 'Upgrade Plano Profissional - Control Frete',
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
                        success: `${origin}/dashboard?payment=success`,
                        failure: `${origin}/dashboard?payment=failure`,
                        pending: `${origin}/dashboard?payment=pending`
                    },
                    auto_return: 'approved'
                }
            });

            console.log("Link gerado com sucesso:", result.init_point);
            return new Response(JSON.stringify({ checkoutUrl: result.init_point }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // MÉTODO 2: PROCESSAMENTO DIRETO (PIX/CARTÃO BRICKS)
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
                first_name: formData?.payer?.first_name || "Motorista",
                last_name: formData?.payer?.last_name || "Profissional"
            },
            metadata: {
                user_id: user.id
            }
        };

        if (formData?.token) {
            paymentBody.token = String(formData.token);
            paymentBody.installments = Number(formData.installments || 1);
        }

        const response = await payment.create({
            body: paymentBody,
            requestOptions: { idempotencyKey: `pay_${user.id}_${Date.now()}` }
        });

        const status = String(response.status);

        // Se aprovado, já libera o premium
        if (status === "approved") {
            await supabaseAdmin.from('profiles').update({
                is_premium: true,
                premium_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                last_payment_id: String(response.id)
            }).eq('id', user.id);

            return new Response(JSON.stringify({ status: "success", paymentId: response.id }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Para Pix pendente
        if (status === "pending") {
            const data: any = { status: "pending", paymentId: response.id };
            if (formData?.payment_method_id === "pix") {
                data.pixData = {
                    qrCode: response.point_of_interaction?.transaction_data?.qr_code,
                    qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64
                };
            }
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Erro retornado pelo Mercado Pago
        return new Response(JSON.stringify({ status: "error", message: response.status_detail }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })

    } catch (error: any) {
        console.error("Global crash in Edge Function:", error);
        return new Response(JSON.stringify({
            error: "Erro interno no servidor.",
            details: error.message
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

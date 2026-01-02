import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'npm:stripe@^14.0.0'
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
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

        if (!stripeSecretKey) {
            throw new Error('STRIPE_SECRET_KEY is not set');
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2023-10-16',
        });

        // Initialize Supabase Client
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401
            });
        }
        const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401
            });
        }

        // Get profile data to find stripe_customer_id
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('stripe_customer_id, email')
            .eq('id', user.id)
            .single();

        let customerId = profile?.stripe_customer_id;

        if (!customerId) {
            // Create a new customer if not exists
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    supabase_user_id: user.id
                }
            });
            customerId = customer.id;

            // Update profile with customer ID
            await supabaseAdmin
                .from('profiles')
                .update({ stripe_customer_id: customerId })
                .eq('id', user.id);
        }

        const origin = req.headers.get('origin') || 'http://localhost:5173';

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    // You should replace this with your actual Price ID from Stripe Dashboard
                    // For now, I'll use a placeholder or create a dynamic one if possible, 
                    // but usually it's better to have a fixed Price ID.
                    // Since I can't know the exact Price ID, I'll use a dummy one or instructions for the user.
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: 'Plano Pro - Control Frete',
                            description: 'Acesso total a todas as funcionalidades do sistema.',
                        },
                        unit_amount: 4999, // R$ 49,99
                        recurring: {
                            interval: 'year',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${origin}/dashboard?payment=success`,
            cancel_url: `${origin}/settings?payment=cancel`,
            metadata: {
                supabase_user_id: user.id
            }
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
})

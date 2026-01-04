import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'npm:stripe@^14.0.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey || !webhookSecret) {
        return new Response('Stripe secrets not configured', { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
        return new Response('No signature', { status: 400 });
    }

    try {
        const body = await req.text();
        const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        console.log(`Processing event: ${event.type}`);

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.supabase_user_id;
                const subscriptionId = session.subscription as string;
                const customerId = session.customer as string;

                if (userId) {
                    // 1. Upgrade User
                    await supabaseAdmin
                        .from('profiles')
                        .update({
                            plano: 'pro',
                            status_assinatura: 'ativa',
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subscriptionId,
                            is_premium: true
                        })
                        .eq('id', userId);
                    console.log(`User ${userId} upgraded to Pro`);


                }
                break;
            }

            case 'customer.subscription.deleted':
            case 'invoice.payment_failed':
            case 'charge.refunded':
            case 'charge.dispute.created': {
                let subscriptionId: string | undefined;
                let userId: string | undefined; // For logging

                // Extract Subscription ID based on event type
                if (event.type === 'customer.subscription.deleted') {
                    const sub = event.data.object as Stripe.Subscription;
                    subscriptionId = sub.id;
                    // Downgrade user logic can stay here or rely on the profile lookup below
                    const customerId = sub.customer as string;
                    const { data: p } = await supabaseAdmin.from('profiles').select('id').eq('stripe_customer_id', customerId).single();
                    if (p) userId = p.id;
                } else if (event.type === 'invoice.payment_failed') {
                    const invoice = event.data.object as Stripe.Invoice;
                    subscriptionId = invoice.subscription as string;
                    const customerId = invoice.customer as string;
                    const { data: p } = await supabaseAdmin.from('profiles').select('id').eq('stripe_customer_id', customerId).single();
                    if (p) userId = p.id;
                } else if (event.type === 'charge.refunded' || event.type === 'charge.dispute.created') {
                    // Harder to link directly to subscription without more queries, but assuming charge -> invoice -> subscription
                    // For now, let's focus on subscription deletion/failure which are key
                }

                // Downgrade User Logic (Preserved from original)
                if (userId) {
                    await supabaseAdmin.from('profiles').update({
                        plano: 'free',
                        status_assinatura: 'cancelada', // or inadimplente
                        is_premium: false
                    }).eq('id', userId);
                    console.log(`User ${userId} downgraded/cancelled`);
                }


                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
})


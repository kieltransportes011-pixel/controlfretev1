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
                    await supabaseAdmin
                        .from('profiles')
                        .update({
                            plano: 'pro',
                            status_assinatura: 'ativa',
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subscriptionId,
                            is_premium: true // Compatibility with old field
                        })
                        .eq('id', userId);
                    console.log(`User ${userId} upgraded to Pro`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const customerId = subscription.customer as string;

                // Find user by customer ID
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (profile) {
                    await supabaseAdmin
                        .from('profiles')
                        .update({
                            plano: 'free',
                            status_assinatura: 'cancelada',
                            is_premium: false
                        })
                        .eq('id', profile.id);
                    console.log(`User ${profile.id} downgraded to Free (subscription deleted)`);
                }
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;

                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (profile) {
                    await supabaseAdmin
                        .from('profiles')
                        .update({
                            status_assinatura: 'inadimplente',
                            plano: 'free', // Optional: decide if they lose access immediately
                            is_premium: false
                        })
                        .eq('id', profile.id);
                    console.log(`User ${profile.id} marked as delinquent`);
                }
                break;
            }

            // Add other events like customer.subscription.updated if needed
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

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

                    // 2. Referral Logic
                    try {
                        // Check if subscription is Annual
                        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                        const price = subscription.items.data[0].price;

                        if (price.recurring?.interval === 'year') {
                            const { data: userProfile } = await supabaseAdmin.from('profiles').select('referred_by').eq('id', userId).single();

                            if (userProfile?.referred_by) {
                                // Find referrer
                                const { data: referrer } = await supabaseAdmin.from('profiles').select('id').eq('referral_code', userProfile.referred_by).single();

                                if (referrer) {
                                    // Check if already referred this user
                                    const { data: existingRef } = await supabaseAdmin.from('referrals').select('id').eq('referred_user_id', userId).single();

                                    if (!existingRef) {
                                        const bonusCF = 1000; // 1000 CF = R$ 10.00

                                        // Insert Referral Record
                                        await supabaseAdmin.from('referrals').insert({
                                            referrer_id: referrer.id,
                                            referred_user_id: userId,
                                            status: 'confirmed',
                                            subscription_id: subscriptionId,
                                            converted_at: new Date().toISOString()
                                        });

                                        // Insert Transaction
                                        await supabaseAdmin.from('cf_transactions').insert({
                                            user_id: referrer.id,
                                            type: 'referral_bonus',
                                            amount_cf: bonusCF,
                                            amount_brl: 10.00,
                                            status: 'confirmed',
                                            source_reference: userId,
                                            description: 'Bônus por indicação (Plano Anual)'
                                        });

                                        // Update Wallet
                                        const { data: wallet } = await supabaseAdmin.from('user_cf_wallet').select('balance_available').eq('user_id', referrer.id).single();

                                        // Initialize wallet if needed (though migration should have done it)
                                        const currentBal = wallet?.balance_available || 0;

                                        await supabaseAdmin.from('user_cf_wallet').upsert({
                                            user_id: referrer.id,
                                            balance_available: currentBal + bonusCF,
                                            updated_at: new Date().toISOString()
                                        });
                                        console.log(`Bonus awarded to referrer ${referrer.id}`);
                                    }
                                }
                            }
                        }
                    } catch (refError) {
                        console.error('Error processing referral:', refError);
                    }
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

                // Revoke Referral Bonus Logic
                if (subscriptionId) {
                    const { data: referral } = await supabaseAdmin.from('referrals').select('*').eq('subscription_id', subscriptionId).single();

                    if (referral && referral.status === 'confirmed') {
                        console.log(`Revoking bonus for referral ${referral.id}`);

                        // Update Referral Status
                        await supabaseAdmin.from('referrals').update({ status: 'revoked' }).eq('id', referral.id);

                        const penaltyCF = -1000;

                        // Create Revoke Transaction
                        await supabaseAdmin.from('cf_transactions').insert({
                            user_id: referral.referrer_id,
                            type: 'referral_bonus', // keeping logic consistent
                            amount_cf: penaltyCF,
                            amount_brl: -10.00,
                            status: 'revoked',
                            source_reference: referral.referred_user_id,
                            description: 'Estorno de bônus (Cancelamento/Falha)'
                        });

                        // Update Wallet
                        const { data: wallet } = await supabaseAdmin.from('user_cf_wallet').select('balance_available').eq('user_id', referral.referrer_id).single();
                        const currentBal = wallet?.balance_available || 0;

                        await supabaseAdmin.from('user_cf_wallet').update({
                            balance_available: currentBal + penaltyCF,
                            updated_at: new Date().toISOString()
                        }).eq('user_id', referral.referrer_id);
                    }
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


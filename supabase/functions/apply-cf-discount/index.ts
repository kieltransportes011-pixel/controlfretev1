import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'npm:stripe@^14.0.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) throw new Error('Unauthorized')

        const { amount_cf } = await req.json()
        if (!amount_cf || amount_cf <= 0) throw new Error('Valor inválido')

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Check Balance
        const { data: wallet } = await supabaseAdmin.from('user_cf_wallet').select('balance_available').eq('user_id', user.id).single()
        if (!wallet || wallet.balance_available < amount_cf) {
            throw new Error('Saldo insuficiente')
        }

        // Get Customer ID
        const { data: profile } = await supabaseAdmin.from('profiles').select('stripe_customer_id').eq('id', user.id).single()
        if (!profile?.stripe_customer_id) throw new Error('Cliente Stripe não encontrado')

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

        // Create Balance Transaction (Credit)
        // 100 CF = 1.00 BRL = 100 cents. So amount_cf IS amount_cents.
        const amountCents = amount_cf;

        // Check if user has active subscription to "Use" the discount? 
        // Usually Stripe Balance applies to *next* invoice.

        await stripe.customers.createBalanceTransaction(
            profile.stripe_customer_id,
            {
                amount: -amountCents, // Negative for credit
                currency: 'brl',
                description: 'Resgate de Pontos CF (Control Frete Coins)'
            }
        )

        // Deduct from Wallet
        await supabaseAdmin.from('cf_transactions').insert({
            user_id: user.id,
            type: 'discount_usage',
            amount_cf: -amount_cf,
            amount_brl: -(amount_cf / 100),
            status: 'completed',
            description: 'Desconto aplicado na fatura Stripe'
        })

        // Update Wallet
        await supabaseAdmin.from('user_cf_wallet').update({
            balance_available: wallet.balance_available - amount_cf,
            updated_at: new Date().toISOString()
        }).eq('user_id', user.id)

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})

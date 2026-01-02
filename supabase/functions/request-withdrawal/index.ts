import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

        const { amount_cf, pix_key } = await req.json()

        if (!amount_cf || amount_cf < 2000) throw new Error('Saque mínimo de 2000 CF')
        if (!pix_key) throw new Error('Chave PIX obrigatória')

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Check Balance
        const { data: wallet } = await supabaseAdmin.from('user_cf_wallet').select('balance_available, balance_blocked').eq('user_id', user.id).single()
        if (!wallet || wallet.balance_available < amount_cf) {
            throw new Error('Saldo insuficiente')
        }

        // Deduct from Available, Add to Blocked
        const newAvailable = wallet.balance_available - amount_cf;
        const newBlocked = (wallet.balance_blocked || 0) + amount_cf;

        await supabaseAdmin.from('user_cf_wallet').update({
            balance_available: newAvailable,
            balance_blocked: newBlocked,
            updated_at: new Date().toISOString()
        }).eq('user_id', user.id)

        // Log Transaction (Pending)
        await supabaseAdmin.from('cf_transactions').insert({
            user_id: user.id,
            type: 'withdrawal',
            amount_cf: -amount_cf,
            amount_brl: -(amount_cf / 100),
            status: 'pending',
            description: `Solicitação de saque PIX: ${pix_key}`
        })

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})

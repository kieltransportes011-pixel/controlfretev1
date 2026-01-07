
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Verify if the caller is an ADMIN
        const { data: { user } } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
        }

        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || profile?.role !== 'admin') {
            throw new Error('Forbidden: Admin access required')
        }

        // 2. Initialize Admin Client (Service Role)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { action, targetId, payload } = await req.json()

        if (!targetId) throw new Error('Target ID required')

        let result = { message: 'Action completed' }
        let logActionDescription = ''

        // 3. Execute Actions
        switch (action) {
            case 'send_password_reset':
                // Send standard recovery email
                const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(targetId)
                if (userError || !userData.user.email) throw new Error('User not found or no email')

                const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(userData.user.email)
                if (resetError) throw resetError

                logActionDescription = 'Enviou email de redefinição de senha'
                result.message = 'Email de redefinição enviado com sucesso.'
                break

            case 'update_user_email':
                if (!payload?.email) throw new Error('New email required')

                const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(targetId, {
                    email: payload.email,
                    email_confirm: true // Auto confirm if admin changes it
                })
                if (emailError) throw emailError

                // Also update public profile
                await supabaseAdmin.from('profiles').update({ email: payload.email }).eq('id', targetId)

                logActionDescription = `Alterou email para ${payload.email}`
                result.message = 'Email atualizado com sucesso.'
                break

            case 'force_logout':
                const { error: logoutError } = await supabaseAdmin.auth.admin.signOut(targetId)
                if (logoutError) throw logoutError

                logActionDescription = 'Forçou logout de todas as sessões'
                result.message = 'Logout forçado com sucesso.'
                break

            case 'set_new_password':
                if (!payload?.password) throw new Error('Password required')

                const { error: pwdError } = await supabaseAdmin.auth.admin.updateUserById(targetId, {
                    password: payload.password
                })
                if (pwdError) throw pwdError

                logActionDescription = 'Definiu nova senha manualmente'
                result.message = 'Nova senha definida com sucesso.'
                break

            default:
                throw new Error('Invalid action')
        }

        // 4. Logs
        // Log Activity for User (Visible in Account History)
        await supabaseAdmin.from('account_activity_logs').insert([{
            user_id: targetId,
            action: `Recuperação Admin: ${logActionDescription}`,
            actor: 'admin'
        }])

        // Log Admin Action (Audit)
        await supabaseAdmin.from('admin_logs').insert([{
            admin_id: user.id,
            action: action.toUpperCase(),
            target_type: 'user',
            target_id: targetId,
            description: logActionDescription
        }])

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})

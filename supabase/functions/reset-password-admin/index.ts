
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { email, cpf } = await req.json();

        if (!email || !cpf) {
            throw new Error('E-mail e CPF são obrigatórios.');
        }

        const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}');
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            secretKeys['controlfrete_1_0'] ?? ''
        );

        // 1. Validate CPF + Email in profiles. This only confirms the account
        // exists — it never authorizes a password change by itself. Email+CPF
        // alone used to be enough to set a new password directly, which meant
        // anyone who knew (or guessed/leaked) a user's CPF could take over
        // their account. Now this just gates who gets a recovery email sent.
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', email)
            .eq('cpf', cpf)
            .single();

        if (profileError || !profile) {
            throw new Error('Dados de validação incorretos (E-mail ou CPF).');
        }

        // 2. Send the standard Supabase recovery email (via the configured
        // SMTP). The actual password change only happens after the user
        // clicks the link and lands on the UPDATE_PASSWORD flow.
        const origin = req.headers.get('origin') || 'https://www.controlfrete.com.br';
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(profile.email, {
            redirectTo: `${origin}/reset-password`,
        });

        if (resetError) throw resetError;

        return new Response(
            JSON.stringify({ message: "Link de redefinição enviado por e-mail" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        );
    }
});

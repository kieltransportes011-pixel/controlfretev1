
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
        const { email, cpf, password } = await req.json();

        if (!email || !cpf || !password) {
            throw new Error('E-mail, CPF e Senha são obrigatórios.');
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1. Validate CPF + Email in profiles
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .eq('cpf', cpf)
            .single();

        if (profileError || !profile) {
            throw new Error('Dados de validação incorretos (E-mail ou CPF).');
        }

        // 2. Update user password via Admin API
        const { error: authError } = await supabase.auth.admin.updateUserById(
            profile.id,
            { password: password }
        );

        if (authError) throw authError;

        return new Response(
            JSON.stringify({ message: "Senha atualizada com sucesso" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        );
    }
});

-- 1. Garantir que as colunas de Trial existam na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_start timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_end timestamptz DEFAULT (now() + interval '7 days');

-- 2. Garantir que RLS permita inserção (caso o trigger falhe e o front tente inserir)
-- (A policy já existe no schema.sql, mas reforçamos)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Trigger robusta para criar perfil automaticamente ao criar usuário no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
  user_cpf text;
BEGIN
  -- Log para debug no Dashboard do Supabase (Database -> Postgres Logs)
  RAISE LOG 'Handling new user creation via Trigger. ID: %, Email: %', NEW.id, NEW.email;

  -- Tenta extrair dados do metadata (enviados pelo frontend)
  user_name := NEW.raw_user_meta_data->>'name';
  user_cpf := NEW.raw_user_meta_data->>'cpf';

  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    cpf, 
    created_at, 
    is_premium,
    trial_start, 
    trial_end
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(user_name, ''), -- Evita falha por NOT NULL se existir essa constraint (embora schema diga nullable)
    COALESCE(user_cpf, ''),
    now(),
    false, -- is_premium false
    now(),
    now() + interval '7 days' -- Trial de 7 dias garantido
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    -- Só atualiza nome/cpf se os atuais estiverem vazios ou se o novo valor for válido
    name = CASE WHEN public.profiles.name IS NULL OR public.profiles.name = '' THEN EXCLUDED.name ELSE public.profiles.name END,
    cpf = CASE WHEN public.profiles.cpf IS NULL OR public.profiles.cpf = '' THEN EXCLUDED.cpf ELSE public.profiles.cpf END;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Associar a trigger à tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

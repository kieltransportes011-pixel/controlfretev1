-- 1. Garantir RLS para Inserção e Atualização
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Trigger no AUTH.USERS (Backend-Side Creation)
-- Esta trigger garante que o perfil exista assim que o usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
  user_cpf text;
BEGIN
  user_name := NEW.raw_user_meta_data->>'name';
  user_cpf := NEW.raw_user_meta_data->>'cpf';

  -- Upsert do Perfil (Insert ou Update seguro)
  INSERT INTO public.profiles (id, email, name, cpf, created_at, is_premium, trial_start, trial_end)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(user_name, ''),
    COALESCE(user_cpf, ''),
    now(),
    false,
    now(),
    now() + interval '7 days'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email; -- Mantém dados existentes, apenas sincroniza email

  -- Upsert de Settings
  INSERT INTO public.settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-registrar Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. REMOÇÃO DE TRIGGERS CONFLITANTES (Correção da Regressão)
-- Removemos os interceptores que retornavam NULL e causavam comportamento inesperado no client
DROP TRIGGER IF EXISTS on_profile_insert_conflict ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_profile_insert_conflict;

DROP TRIGGER IF EXISTS on_settings_insert_conflict ON public.settings;
DROP FUNCTION IF EXISTS public.handle_settings_insert_conflict;

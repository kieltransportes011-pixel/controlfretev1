-- 1. Garantir que as colunas de Trial existam
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_start timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_end timestamptz DEFAULT (now() + interval '7 days');

-- 2. Trigger Robusta em Auth.Users
-- Cria automaticamente o perfil e settings assim que o usuário é registrado no Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
  user_cpf text;
BEGIN
  RAISE LOG 'Handling new user creation via Trigger. ID: %', NEW.id;

  user_name := NEW.raw_user_meta_data->>'name';
  user_cpf := NEW.raw_user_meta_data->>'cpf';

  -- Cria Perfil
  INSERT INTO public.profiles (
    id, email, name, cpf, created_at, is_premium, trial_start, trial_end
  )
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
  SET
    email = EXCLUDED.email; 

  -- Cria Settings
  INSERT INTO public.settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Interceptores de Segurança (Redundância)
-- Evitam erros caso o frontend tente fazer INSERT direto (mesmo com o fix do upsert no front, isso protege chamadas diretas ou versões antigas em cache).
CREATE OR REPLACE FUNCTION public.handle_profile_insert_conflict()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    -- Converte INSERT em UPDATE
    UPDATE public.profiles
    SET
      name = COALESCE(NEW.name, name),
      cpf = COALESCE(NEW.cpf, cpf),
      email = COALESCE(NEW.email, email)
    WHERE id = NEW.id;
    RETURN NULL; -- Cancela o INSERT
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_insert_conflict ON public.profiles;
CREATE TRIGGER on_profile_insert_conflict
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_insert_conflict();

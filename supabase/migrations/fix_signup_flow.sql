-- 1. Garantir colunas de Trial na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_start timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_end timestamptz DEFAULT (now() + interval '7 days');

-- 2. Garantir RLS para insert (redundância de segurança)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Trigger PRIMÁRIA: Criação automática de Perfil e Configurações (Robustez Backend)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
  user_cpf text;
BEGIN
  RAISE LOG 'Handling new user creation via Trigger. ID: %', NEW.id;

  user_name := NEW.raw_user_meta_data->>'name';
  user_cpf := NEW.raw_user_meta_data->>'cpf';

  -- Inserir Perfil
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
    email = EXCLUDED.email; -- Apenas garante email atualizado, não sobrescreve outros dados se já existirem

  -- Inserir Settings (Garante que settings existem mesmo se frontend falhar)
  INSERT INTO public.settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger na tabela de Autenticação
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 4. INTERCEPTOR DE PERFIL: Resolve conflito quando o Frontend tenta inserir o Perfil já criado
CREATE OR REPLACE FUNCTION public.handle_profile_insert_conflict()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RAISE LOG 'Profile interceptor: converting INSERT to UPDATE for ID %', NEW.id;
    
    -- Atualiza com os dados vindos do frontend (que podem ser mais completos que os do trigger de auth)
    UPDATE public.profiles
    SET
      name = COALESCE(NEW.name, name),
      cpf = COALESCE(NEW.cpf, cpf),
      email = COALESCE(NEW.email, email)
    WHERE id = NEW.id;

    -- Cancela o INSERT para evitar erro de Duplicate Key
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_insert_conflict ON public.profiles;
CREATE TRIGGER on_profile_insert_conflict
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_insert_conflict();


-- 5. INTERCEPTOR DE SETTINGS: Resolve conflito quando o Frontend tenta inserir Settings já criadas
CREATE OR REPLACE FUNCTION public.handle_settings_insert_conflict()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.settings WHERE user_id = NEW.user_id) THEN
    -- Apenas ignora silenciosamente, mantendo a versão criada pelo trigger (ou anterior)
    RETURN NULL; 
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_settings_insert_conflict ON public.settings;
CREATE TRIGGER on_settings_insert_conflict
  BEFORE INSERT ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_settings_insert_conflict();

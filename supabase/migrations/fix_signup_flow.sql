-- 1. Garantir que as colunas de Trial existam na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_start timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_end timestamptz DEFAULT (now() + interval '7 days');

-- 2. Garantir que RLS permita inserção
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
  -- Log para debug
  RAISE LOG 'Handling new user creation via Trigger. ID: %, Email: %', NEW.id, NEW.email;

  -- Tenta extrair dados do metadata 
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
    COALESCE(user_name, ''),
    COALESCE(user_cpf, ''),
    now(),
    false,
    now(),
    now() + interval '7 days'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
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

-- 5. INTERCEPTOR: Evita erro de duplicação quando o Frontend faz INSERT
-- Como não podemos alterar o frontend (que faz insert), e o trigger acima já cria o perfil (que causa duplicate key no insert),
-- criamos um trigger BEFORE INSERT na tabela profiles que converte o INSERT em UPDATE se já existir.

CREATE OR REPLACE FUNCTION public.handle_profile_insert_conflict()
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se o perfil já existe (criado pelo trigger handle_new_user)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    
    RAISE LOG 'Profile already exists for ID %. Converting INSERT to UPDATE.', NEW.id;

    -- Atualiza o perfil existente com os dados vindos do INSERT (corrigindo nome/cpf que podem estar vazios)
    UPDATE public.profiles
    SET
      name = COALESCE(NEW.name, name),
      cpf = COALESCE(NEW.cpf, cpf),
      email = COALESCE(NEW.email, email),
      is_premium = COALESCE(NEW.is_premium, is_premium),
      trial_start = COALESCE(NEW.trial_start, trial_start),
      trial_end = COALESCE(NEW.trial_end, trial_end)
    WHERE id = NEW.id;

    -- Retorna NULL para cancelar o INSERT original (evitando erro de Duplicate Key)
    RETURN NULL;
  END IF;

  -- Se não existe, prossegue com o INSERT normal
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_insert_conflict ON public.profiles;
CREATE TRIGGER on_profile_insert_conflict
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_insert_conflict();

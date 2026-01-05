-- 1. Disable/Drop existing triggers that might cause recursion or conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- 2. Enhance/Ensure 'profiles' table exists with robust structure
-- We DO NOT drop the table to preserve data, but we ensure it matches requirements of robustness.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  plano TEXT DEFAULT 'FREE',
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT,
  cpf TEXT
);

-- Ensure 'plano' column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'plano') THEN
        ALTER TABLE public.profiles ADD COLUMN plano TEXT DEFAULT 'FREE';
    END IF;
END $$;

-- Ensure 'created_at' column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- 3. Reset RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove old complicated policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Create Simple, Clear Policies
-- INSERT: Authenticated user can create their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- SELECT: User can read only their own data
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- UPDATE: User can update only their own data
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

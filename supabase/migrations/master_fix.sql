-- MASTER CLEANUP SCRIPT
-- Executes all necessary cleanups to Ensure a "Fail Proof" Signup Flow
-- 1. Remove ALL Known Triggers that cause instability
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

DROP TRIGGER IF EXISTS on_auth_user_created_referral ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_premium_update ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_referral;
DROP FUNCTION IF EXISTS public.handle_referral_reward;

-- Drop verify_freight_limit if exists (from enforce_limits.sql - simplified version)
DROP TRIGGER IF EXISTS enforce_freight_limit ON public.freights;

-- 2. Ensure Profiles Table Structure
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  cpf TEXT,
  plano TEXT DEFAULT 'FREE',
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Add these columns to prevent "missing column" errors from legacy code
  referred_by TEXT,
  referral_code TEXT,
  referral_balance NUMERIC DEFAULT 0,
  referral_count INTEGER DEFAULT 0
);

-- Ensure critical columns exist (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'plano') THEN
        ALTER TABLE public.profiles ADD COLUMN plano TEXT DEFAULT 'FREE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referred_by') THEN
        ALTER TABLE public.profiles ADD COLUMN referred_by TEXT;
    END IF;
END $$;

-- 3. Reset RLS Policies (The Source of Truth)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Create Minimalist/Safe Policies
-- INSERT: Strict check that auth.uid matches row id
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- SELECT: Only own data
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- UPDATE: Only own data
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- 4. Settings Table Safety (Ensure it exists for the Auth flow)
CREATE TABLE IF NOT EXISTS public.settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light'
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can view own settings" ON public.settings;

CREATE POLICY "Users can insert own settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id);

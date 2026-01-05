-- 🚨 EMERGENCY RESET SCRIPT 🚨
-- This script WIPES the existing user data structure and rebuilds it from scratch.
-- GOAL: A clean, conflict-free foundation for the auth system.

--------------------------------------------------------------------------------
-- 1. DROP EVERYTHING (CLEAN SLATE)
--------------------------------------------------------------------------------

-- Drop Tables (Cascade to remove dependent views/constraints)
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- Drop Functions & Triggers (Explicit cleanup of known legacy logic)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_referral ON public.profiles; -- if it existed
DROP TRIGGER IF EXISTS on_profile_premium_update ON public.profiles; -- if it existed

DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_referral CASCADE;
DROP FUNCTION IF EXISTS public.handle_referral_reward CASCADE;
DROP FUNCTION IF EXISTS public.check_freight_limit CASCADE; -- Cleaning up limits too to prevent side effects

--------------------------------------------------------------------------------
-- 2. CREATE NEW TABLES (MINIMAL & ROBUST)
--------------------------------------------------------------------------------

-- Profiles Table
-- Strict adherence to: id = auth.uid(), simple text fields, strict RLS.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT DEFAULT '',
    cpf TEXT DEFAULT '',
    plano TEXT DEFAULT 'FREE',
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Optional fields for future use, nullable to avoid breaking
    usage_stats JSONB DEFAULT '{}'::jsonb
);

-- Settings Table (Simplified)
CREATE TABLE public.settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------------------------------------
-- 3. ENABLE RLS (ROW LEVEL SECURITY)
--------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 4. CREATE POLICIES (STRICT: OWNERSHIP REQUIRED)
--------------------------------------------------------------------------------

-- Profiles Policies
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Settings Policies
CREATE POLICY "Users can insert own settings" ON public.settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own settings" ON public.settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.settings
    FOR UPDATE USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 5. FINAL CONFIRMATION
--------------------------------------------------------------------------------

-- No auto-triggers.
-- No complex enums.
-- No invisible dependencies.
-- Ready for client-side Auth flow.

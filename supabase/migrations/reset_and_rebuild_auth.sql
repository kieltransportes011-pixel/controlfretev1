-- 🚨 EMERGENCY RESET SCRIPT (CORRECTED) 🚨
-- This script WIPES the existing user data structure and rebuilds it from scratch.
-- GOAL: A clean, conflict-free foundation for the auth system.

--------------------------------------------------------------------------------
-- 1. CLEANUP (External Refs First)
--------------------------------------------------------------------------------

-- Remove triggers from AUTH schema (these persist even if public tables are dropped)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove Functions (Use CASCADE to handle any lingering dependencies)
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_referral CASCADE;
DROP FUNCTION IF EXISTS public.handle_referral_reward CASCADE;
DROP FUNCTION IF EXISTS public.check_freight_limit CASCADE;

--------------------------------------------------------------------------------
-- 2. DROP TABLES (CASCADE deletes dependent triggers/views automatically)
--------------------------------------------------------------------------------

-- We drop tables NOW. This automatically removes 'on_auth_user_created_referral' 
-- and any other triggers attached directly to these tables.
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

--------------------------------------------------------------------------------
-- 3. CREATE NEW TABLES (MINIMAL & ROBUST)
--------------------------------------------------------------------------------

-- Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT DEFAULT '',
    cpf TEXT DEFAULT '',
    plano TEXT DEFAULT 'FREE',
    created_at TIMESTAMPTZ DEFAULT now(),
    usage_stats JSONB DEFAULT '{}'::jsonb
);

-- Settings Table
CREATE TABLE public.settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMPTZ DEFAULT now()
);

--------------------------------------------------------------------------------
-- 4. ENABLE RLS (ROW LEVEL SECURITY)
--------------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 5. CREATE POLICIES (STRICT)
--------------------------------------------------------------------------------

-- Profiles Policies
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Settings Policies
CREATE POLICY "Users can insert own settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- 6. FINAL STATE
--------------------------------------------------------------------------------
-- Tables recreated cleanly.
-- No legacy triggers.
-- RLS enabled.

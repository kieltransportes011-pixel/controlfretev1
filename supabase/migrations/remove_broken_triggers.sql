-- Remove problematic referral triggers that are causing "record 'new' has no field 'referred_by'" errors.
-- We are prioritizing a clean, stable signup flow.

-- 1. Drop Triggers on 'profiles' table
DROP TRIGGER IF EXISTS on_auth_user_created_referral ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_premium_update ON public.profiles;

-- 2. Drop corresponding Functions
DROP FUNCTION IF EXISTS public.handle_new_referral;
DROP FUNCTION IF EXISTS public.handle_referral_reward;

-- 3. Safety check: ensure no other triggers are blocking inserts
-- We keep RLS triggers if they exist (usually system managed), but remove user-defined logic complexity.
-- (No specific command to drop "all" triggers, so we target known ones from the codebase analysis)

-- 4. Ensure schema stability
-- If the 'referred_by' column IS missing and needed for future logic, we can add it nullable.
-- But primarily, we just stopped the code that was crashing because of it.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_balance NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;

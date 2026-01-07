-- Migration: Add privacy_policy_accepted_at to profiles

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMPTZ;

-- No new policies needed as users can already update their own profile.

-- 1. Ensure Profiles Table has correct columns (SAFE MIGRATION)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status_assinatura TEXT DEFAULT 'ativa';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_payment_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_start TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_changes_used INTEGER DEFAULT 0;

-- 2. Restore handle_new_user function and trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    name, 
    plano, 
    status_assinatura, 
    is_premium,
    created_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    'FREE',
    'ativa',
    FALSE,
    now()
  )
  ON CONFLICT (id) DO NOTHING; -- Idempotency
  
  -- Create default settings
  INSERT INTO public.settings (user_id, theme)
  VALUES (new.id, 'light')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Fix for existing users who might be missing a profile (Safe Insert)
-- This tries to fill in gaps for users who signed up while the trigger was missing.
INSERT INTO public.profiles (id, email, created_at)
SELECT id, email, created_at FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Ensure settings also exist
INSERT INTO public.settings (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.settings)
ON CONFLICT (user_id) DO NOTHING;

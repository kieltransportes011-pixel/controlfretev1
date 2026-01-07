-- Migration: Initialize Referral System
-- 1. Add referrer_id to profiles if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referrer_id') THEN
        ALTER TABLE public.profiles ADD COLUMN referrer_id UUID REFERENCES public.profiles(id);
        CREATE INDEX idx_profiles_referrer_id ON public.profiles(referrer_id);
    END IF;
END $$;

-- 2. Create commissions table
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id),
    referred_id UUID NOT NULL REFERENCES public.profiles(id),
    amount NUMERIC(10, 2) NOT NULL, -- The 20% value
    base_amount NUMERIC(10, 2) NOT NULL, -- The plan price
    source_payment_id TEXT UNIQUE, -- Idempotency key from MP
    status TEXT DEFAULT 'pending', -- pending, approved, cancelled
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes for commissions
CREATE INDEX IF NOT EXISTS idx_commissions_referrer ON public.commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_commissions_referred ON public.commissions(referred_id);

-- 4. Enable RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Users can view their own commissions (as referrer)
DROP POLICY IF EXISTS "Referrers can view own income" ON public.commissions;
CREATE POLICY "Referrers can view own income" ON public.commissions
FOR SELECT TO authenticated
USING (auth.uid() = referrer_id);

-- Admins can view ALL commissions (using IsAdmin function from previous migration)
DROP POLICY IF EXISTS "Admins can view all commissions" ON public.commissions;
CREATE POLICY "Admins can view all commissions" ON public.commissions
FOR SELECT TO authenticated
USING (public.is_admin());

-- Admins can update commissions
DROP POLICY IF EXISTS "Admins can update commissions" ON public.commissions;
CREATE POLICY "Admins can update commissions" ON public.commissions
FOR UPDATE TO authenticated
USING (public.is_admin());

-- 6. Prevent self-referral constraint (Optional but good)
-- We rely on App logic, but a constraint prevents data corruption
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS check_not_self_referral;
ALTER TABLE public.profiles ADD CONSTRAINT check_not_self_referral CHECK (id != referrer_id);

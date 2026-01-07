-- Migration: Refine Admin Dashboard (Privacy & Management)

-- 1. REVOKE broad access to financial tables for Admins (Privacy First)
-- We drop the policies created in the previous step.
DROP POLICY IF EXISTS "Admins can view all freights" ON public.freights;
DROP POLICY IF EXISTS "Admins can update all freights" ON public.freights;
DROP POLICY IF EXISTS "Admins can view all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can update all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all accounts payable" ON public.contas_a_pagar;

-- Keep 'profiles' and 'settings' policies as they are needed for management.

-- 2. Add 'account_status' to profiles for Ban/Suspension logic
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active'; -- 'active', 'suspended', 'banned'

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- 3. Create 'admin_logs' table for auditing
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id),
    target_user_id UUID REFERENCES auth.users(id), -- Nullable if action is global
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS for Helper Tables

-- Admin Logs: Admins can INSERT (log action) and SELECT (view history)
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert logs" 
ON public.admin_logs FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view logs" 
ON public.admin_logs FOR SELECT 
TO authenticated 
USING (public.is_admin());

-- 5. Helper Function to "Soft Delete" (Ban) user
-- Actually, we'll just update the row via client, but policies need to allow it.
-- We already have "Admins can update all profiles".

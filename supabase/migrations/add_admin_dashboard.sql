-- Migration: Add Admin Role and Policies for Admin Dashboard

-- 1. Add role column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Utility Function: is_admin()
-- Returns true if the current user has role 'admin'.
-- SECURITY DEFINER allows this function to read profiles table even if RLS would block it (though RLS on profiles usually allows reading own, this ensures consistency).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create RLS Policies for Admin Access
-- These policies are ADDITIVE to existing ones.

-- Profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (public.is_admin());

-- Settings
CREATE POLICY "Admins can view all settings" 
ON public.settings FOR SELECT 
TO authenticated
USING (public.is_admin());

-- Freights
CREATE POLICY "Admins can view all freights" 
ON public.freights FOR SELECT 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update all freights" 
ON public.freights FOR UPDATE 
TO authenticated
USING (public.is_admin());

-- Expenses
CREATE POLICY "Admins can view all expenses" 
ON public.expenses FOR SELECT 
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update all expenses" 
ON public.expenses FOR UPDATE 
TO authenticated
USING (public.is_admin());

-- Bookings (Agenda)
CREATE POLICY "Admins can view all bookings" 
ON public.bookings FOR SELECT 
TO authenticated
USING (public.is_admin());

-- Accounts Payable (Contas a Pagar)
CREATE POLICY "Admins can view all accounts payable" 
ON public.contas_a_pagar FOR SELECT 
TO authenticated
USING (public.is_admin());

-- 5. Emergency Admin Promotion (Commented/Instructions)
-- Run this in SQL Editor to set yourself as admin:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your_email@example.com';

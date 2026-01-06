-- Add missing columns to settings table to support new settings features
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_doc TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_phone TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_address_street TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_address_number TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_address_neighborhood TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_address_city TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_address_state TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_address_zip TEXT;

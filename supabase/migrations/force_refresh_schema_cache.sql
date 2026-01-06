-- 1. Ensure Columns Exist (Force Add)
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS default_company_percent NUMERIC DEFAULT 40;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS default_driver_percent NUMERIC DEFAULT 40;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS default_reserve_percent NUMERIC DEFAULT 20;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS monthly_goal NUMERIC DEFAULT 0;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light';

-- Issuer Columns
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_name TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_doc TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_phone TEXT DEFAULT '';

-- Address Columns
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_address_street TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_address_number TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_address_neighborhood TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_address_city TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_address_state TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS issuer_address_zip TEXT DEFAULT '';

-- 2. Force permissions grant (just in case)
GRANT ALL ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;

-- 3. Reload the PostgREST Schema Cache (Critical for 'schema cache' errors)
NOTIFY pgrst, 'reload config';

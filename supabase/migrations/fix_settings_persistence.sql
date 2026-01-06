-- Ensure settings table exists with all required columns
CREATE TABLE IF NOT EXISTS public.settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- App Preferences
    theme TEXT DEFAULT 'light',
    default_company_percent NUMERIC DEFAULT 40,
    default_driver_percent NUMERIC DEFAULT 40,
    default_reserve_percent NUMERIC DEFAULT 20,
    monthly_goal NUMERIC DEFAULT 0,
    
    -- Issuer / Receipt Data
    issuer_name TEXT DEFAULT '',
    issuer_doc TEXT DEFAULT '',
    issuer_phone TEXT DEFAULT '',
    
    -- Issuer Address
    issuer_address_street TEXT DEFAULT '',
    issuer_address_number TEXT DEFAULT '',
    issuer_address_neighborhood TEXT DEFAULT '',
    issuer_address_city TEXT DEFAULT '',
    issuer_address_state TEXT DEFAULT '',
    issuer_address_zip TEXT DEFAULT ''
);

-- Safe column additions in case table already existed but missed columns
DO $$
BEGIN
    -- Preferences
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'theme') THEN
        ALTER TABLE public.settings ADD COLUMN theme TEXT DEFAULT 'light';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'default_company_percent') THEN
        ALTER TABLE public.settings ADD COLUMN default_company_percent NUMERIC DEFAULT 40;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'default_driver_percent') THEN
        ALTER TABLE public.settings ADD COLUMN default_driver_percent NUMERIC DEFAULT 40;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'default_reserve_percent') THEN
        ALTER TABLE public.settings ADD COLUMN default_reserve_percent NUMERIC DEFAULT 20;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'monthly_goal') THEN
        ALTER TABLE public.settings ADD COLUMN monthly_goal NUMERIC DEFAULT 0;
    END IF;

    -- Issuer Data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'issuer_name') THEN
        ALTER TABLE public.settings ADD COLUMN issuer_name TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'issuer_doc') THEN
        ALTER TABLE public.settings ADD COLUMN issuer_doc TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'issuer_phone') THEN
        ALTER TABLE public.settings ADD COLUMN issuer_phone TEXT DEFAULT '';
    END IF;

    -- Address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'issuer_address_street') THEN
        ALTER TABLE public.settings ADD COLUMN issuer_address_street TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'issuer_address_number') THEN
        ALTER TABLE public.settings ADD COLUMN issuer_address_number TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'issuer_address_neighborhood') THEN
        ALTER TABLE public.settings ADD COLUMN issuer_address_neighborhood TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'issuer_address_city') THEN
        ALTER TABLE public.settings ADD COLUMN issuer_address_city TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'issuer_address_state') THEN
        ALTER TABLE public.settings ADD COLUMN issuer_address_state TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'issuer_address_zip') THEN
        ALTER TABLE public.settings ADD COLUMN issuer_address_zip TEXT DEFAULT '';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.settings;
DROP POLICY IF EXISTS "Enable all access for own settings" ON public.settings;

-- Create comprehensive policies
CREATE POLICY "Users can view own settings" ON public.settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.settings
    FOR UPDATE USING (auth.uid() = user_id);

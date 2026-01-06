-- Ensure 'settings' has a unique constraint on 'user_id' so we can UPSERT by it safely
-- This handles legacy cases where 'id' might be the PK instead of 'user_id'

DO $$
BEGIN
    -- Check if user_id is already the PK. If so, it's unique.
    -- If not, we ensure there is a unique index/constraint on it.
    
    -- Check for existing unique constraint/index
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.settings'::regclass
        AND contype IN ('p', 'u')
        AND conkey = ARRAY[(
            SELECT attnum 
            FROM pg_attribute 
            WHERE attrelid = 'public.settings'::regclass 
            AND attname = 'user_id'
        )]
    ) THEN
        ALTER TABLE public.settings ADD CONSTRAINT settings_user_id_key UNIQUE (user_id);
    END IF;

EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist, create it properly
        CREATE TABLE public.settings (
            user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            theme TEXT DEFAULT 'light',
            default_company_percent NUMERIC DEFAULT 40,
            default_driver_percent NUMERIC DEFAULT 40,
            default_reserve_percent NUMERIC DEFAULT 20,
            monthly_goal NUMERIC DEFAULT 0,
            issuer_name TEXT DEFAULT '',
            issuer_doc TEXT DEFAULT '',
            issuer_phone TEXT DEFAULT '',
            issuer_address_street TEXT DEFAULT '',
            issuer_address_number TEXT DEFAULT '',
            issuer_address_neighborhood TEXT DEFAULT '',
            issuer_address_city TEXT DEFAULT '',
            issuer_address_state TEXT DEFAULT '',
            issuer_address_zip TEXT DEFAULT ''
        );
        -- Enable RLS
        ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
        
        -- Policies
        CREATE POLICY "Users can view own settings" ON public.settings FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "Users can insert own settings" ON public.settings FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY "Users can update own settings" ON public.settings FOR UPDATE USING (auth.uid() = user_id);
END $$;

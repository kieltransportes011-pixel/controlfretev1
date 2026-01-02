-- Add Stripe columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plano text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS status_assinatura text DEFAULT 'ativa',
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- Ensure RLS allows users to read their own plan status (assuming RLS is active)
-- (Existing policies usually cover select *, but good to be sure)

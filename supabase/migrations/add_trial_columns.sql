-- Add trial columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_start timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_end timestamptz DEFAULT (now() + interval '7 days');

-- Optional: Update existing users to have a trial_end based on their creation date if null
UPDATE public.profiles 
SET trial_end = created_at + interval '7 days', trial_start = created_at
WHERE trial_end IS NULL;

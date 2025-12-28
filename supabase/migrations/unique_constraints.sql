-- Add UNIQUE constraints to profiles table
-- unique_email is usually enforced by Supabase Auth, but good to have in profiles if strictly needed
-- unique_cpf is the critical one for this request

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_cpf_key UNIQUE (cpf);

-- If email column exists in profiles and should be unique:
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_email_key UNIQUE (email);

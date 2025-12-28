-- Function to handle referral rewards (CF Currency)
CREATE OR REPLACE FUNCTION public.handle_referral_reward()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger logic: 
  -- 1. Old state was NOT premium (false or null)
  -- 2. New state IS premium (true)
  -- 3. User has a valid referrer (referred_by is not null)
  
  IF (OLD.is_premium = false OR OLD.is_premium IS NULL) AND (NEW.is_premium = true) AND (NEW.referred_by IS NOT NULL) THEN
    -- Update the referrer's balance and count
    -- Reward: 200 CF (Points)
    UPDATE public.profiles
    SET 
      referral_balance = referral_balance + 200, 
      referral_count = referral_count + 1
    WHERE referral_code = NEW.referred_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old triggers/functions if they exist to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created_referral ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_referral;
DROP TRIGGER IF EXISTS on_profile_premium_update ON public.profiles;

-- Create new Trigger (Update based)
CREATE TRIGGER on_profile_premium_update
  AFTER UPDATE OF is_premium ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_referral_reward();

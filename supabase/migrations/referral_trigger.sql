-- Function to handle new referrals
CREATE OR REPLACE FUNCTION public.handle_new_referral()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the new user has a referrer
  IF NEW.referred_by IS NOT NULL THEN
    -- Update the referrer's balance and count
    -- Verification: Ensure referrer exists to avoid errors, although FK or application logic usually handles this.
    -- We simply do an update. If code doesn't exist, nothing happens.
    UPDATE public.profiles
    SET 
      referral_balance = referral_balance + 2.00, -- Reward amount
      referral_count = referral_count + 1
    WHERE referral_code = NEW.referred_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new profile creation
DROP TRIGGER IF EXISTS on_auth_user_created_referral ON public.profiles;
CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_referral();

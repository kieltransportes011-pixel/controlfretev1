-- Create a robust trigger to ensure PRO access is granted immediately upon Payment Approval

-- 1. Create the function that performs the upgrade
CREATE OR REPLACE FUNCTION public.handle_payment_approved()
RETURNS TRIGGER AS $$
BEGIN
    -- Only act if the payment is approved
    IF NEW.status = 'approved' THEN
        -- Check if it's a new approval (Insert or Update from non-approved)
        IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'approved') THEN
            
            -- Update the User Profile
            UPDATE public.profiles
            SET 
                is_premium = true,
                plano = 'pro',
                status_assinatura = 'ativa',
                premium_until = (now() + interval '1 year'), -- Default to 1 year for now, or check amount
                last_payment_id = NEW.payment_id,
                updated_at = now()
            WHERE id = NEW.user_id;

            -- If no profile existed (rare/impossible if FK exists, but safe to handle), insert it?
            -- Usually profiles exist since created at signup. 
            -- If row count = 0, we could log warning, but for now we assume profile exists.
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger on payment_history
DROP TRIGGER IF EXISTS on_payment_approved_trigger ON public.payment_history;

CREATE TRIGGER on_payment_approved_trigger
AFTER INSERT OR UPDATE ON public.payment_history
FOR EACH ROW
EXECUTE FUNCTION public.handle_payment_approved();

-- 3. Run a "Backfill" fix for any existing approved payments that might have been missed
-- This updates any profile that has an approved payment in history but is still marked as FREE
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT ph.user_id, ph.payment_id
        FROM public.payment_history ph
        JOIN public.profiles p ON p.id = ph.user_id
        WHERE ph.status = 'approved' 
        AND (p.plano IS DISTINCT FROM 'pro' OR p.is_premium IS DISTINCT FROM true)
    LOOP
        -- Upgrade the user
        UPDATE public.profiles
        SET 
            is_premium = true,
            plano = 'pro',
            status_assinatura = 'ativa',
            premium_until = (now() + interval '1 year'),
            last_payment_id = r.payment_id
        WHERE id = r.user_id;
        
        RAISE NOTICE 'Fixed User % (Payment %)', r.user_id, r.payment_id;
    END LOOP;
END $$;

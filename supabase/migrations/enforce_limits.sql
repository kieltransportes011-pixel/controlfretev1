-- 1. Create function to count freights
CREATE OR REPLACE FUNCTION check_freight_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  user_plan TEXT;
BEGIN
  -- Get user plan
  SELECT plano INTO user_plan FROM profiles WHERE id = auth.uid();

  -- If PRO, allow everything
  IF user_plan = 'pro' THEN
    RETURN NEW;
  END IF;

  -- Count freights for this month
  SELECT COUNT(*) INTO current_count 
  FROM freights 
  WHERE user_id = auth.uid() 
  AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE);

  -- If limit reached (5), raise error
  IF current_count >= 5 THEN
    RAISE EXCEPTION 'Limite do Plano Gratuito atingido (5 fretes/mês). Assine o Pro para desbloquear.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger
DROP TRIGGER IF EXISTS enforce_freight_limit ON freights;
CREATE TRIGGER enforce_freight_limit
BEFORE INSERT ON freights
FOR EACH ROW
EXECUTE FUNCTION check_freight_limit();

-- 3. RLS for Select (History Limit)
-- Enable RLS on freights if not enabled (it likely is)
ALTER TABLE freights ENABLE ROW LEVEL SECURITY;

-- Drop existing select policy if it conflicts (assuming 'Users can view own freights')
DROP POLICY IF EXISTS "Users can view own freights" ON freights;

-- Create new policy
CREATE POLICY "Users can view own freights with plan limits" ON freights
FOR SELECT
USING (
  auth.uid() = user_id 
  AND (
    (SELECT plano FROM profiles WHERE id = auth.uid()) = 'pro'
    OR
    date >= (CURRENT_DATE - INTERVAL '7 days')
  )
);

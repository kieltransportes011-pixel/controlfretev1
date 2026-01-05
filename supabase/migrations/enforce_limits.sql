-- Controle de Limites e Acesso (Trial / Pro)

-- 1. Função para verificar limite de fretes (Plano Gratuito)
CREATE OR REPLACE FUNCTION check_freight_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  user_plan TEXT;
  user_premium BOOLEAN;
  user_trial_end TIMESTAMPTZ;
BEGIN
  -- Buscar dados do usuário
  SELECT plano, is_premium, trial_end 
  INTO user_plan, user_premium, user_trial_end 
  FROM profiles WHERE id = auth.uid();

  -- Se for PRO, Premium ou estiver no Trial, liberar geral
  IF user_plan = 'pro' OR user_premium = true OR (user_trial_end > now()) THEN
    RETURN NEW;
  END IF;

  -- Contar fretes deste mês
  SELECT COUNT(*) INTO current_count 
  FROM freights 
  WHERE user_id = auth.uid() 
  AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE);

  -- Limite: 5 fretes por mês no plano gratuito (expirado)
  IF current_count >= 5 THEN
    RAISE EXCEPTION 'Limite do Plano Gratuito atingido (5 fretes/mês). Assine o Pro para desbloquear.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger de limite
DROP TRIGGER IF EXISTS enforce_freight_limit ON freights;
CREATE TRIGGER enforce_freight_limit
BEFORE INSERT ON freights
FOR EACH ROW
EXECUTE FUNCTION check_freight_limit();


-- 3. RLS Atualizada para Histórico (Visualização)
ALTER TABLE freights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own freights" ON freights;
DROP POLICY IF EXISTS "Users can view own freights with plan limits" ON freights;

CREATE POLICY "Users can view own freights with plan limits" ON freights
FOR SELECT
USING (
  auth.uid() = user_id 
  AND (
    (SELECT plano FROM profiles WHERE id = auth.uid()) = 'pro'
    OR
    (SELECT is_premium FROM profiles WHERE id = auth.uid()) = true
    OR
    (SELECT trial_end FROM profiles WHERE id = auth.uid()) > now()
    OR
    -- Fallback: Se o trial acabou, vê apenas os ultimos 7 dias de dados? 
    -- Ou mantemos acesso total ao histórico? 
    -- A regra original era: "Trial de 7 dias com acesso total". Pós trial, vira Free (limitado a criar novos, mas ver antigos deveria ser ok? 
    -- O código original limitava a visualização. Mantendo a lógica original + trial fix:)
    date >= (CURRENT_DATE - INTERVAL '7 days') 
    -- Nota: Isso significa que usuários free só veem fretes recentes. Usuários em trial veem tudo.
  )
);

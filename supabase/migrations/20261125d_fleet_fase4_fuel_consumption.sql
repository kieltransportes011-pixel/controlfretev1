-- FASE 4 do plano de profissionalizacao da Frota: abastecimento (litros +
-- odometro) pra calcular consumo medio e custo por KM por periodo. Aditiva -
-- nao presume que lancamentos antigos de combustivel tenham esses dados
-- (ficam NULL, e o calculo de consumo so roda quando houver leituras
-- suficientes).

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS liters numeric,
  ADD COLUMN IF NOT EXISTS odometer_km numeric;

-- Abastecimento passa a poder gerar uma leitura de odometro (Fase 2), igual
-- manutencao e frete ja fazem. A constraint ja existe em producao (aplicada
-- na Fase 2) - so adiciona 'fuel' na lista permitida.
ALTER TABLE public.vehicle_odometer_readings
  DROP CONSTRAINT IF EXISTS vehicle_odometer_readings_source_check;

ALTER TABLE public.vehicle_odometer_readings
  ADD CONSTRAINT vehicle_odometer_readings_source_check
  CHECK (source IN ('manual', 'maintenance', 'freight', 'correction', 'fuel'));

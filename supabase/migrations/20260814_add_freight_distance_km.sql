-- Distância calculada (km) via Google Routes API, preenchida automaticamente
-- a partir de Origem/Destino no formulário de frete. Continua editável
-- manualmente, não é travada pelo cálculo automático.

ALTER TABLE public.freights ADD COLUMN IF NOT EXISTS distance_km numeric;

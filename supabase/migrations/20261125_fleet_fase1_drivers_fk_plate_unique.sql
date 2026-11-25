-- FASE 1 do plano de profissionalizacao da Frota: vinculo formal veiculo <-> motorista
-- e unicidade de placa por usuario. Aditivo e reversivel - nao remove nenhuma
-- coluna nem apaga dado existente.
--
-- Verificado direto no banco (producao, 2026-11-25, somente leitura) antes de
-- escrever isto: 0 placas duplicadas por usuario (mesmo normalizando
-- maiusculas/espaco/traco) e 0 motoristas cadastrados ainda, logo o backfill
-- abaixo nao afeta nenhuma linha hoje - fica pronto pra quando o cadastro de
-- motoristas comecar a ser usado.

-- 1) Vinculo formal: coluna nova, nullable, SET NULL se o motorista for
-- excluido (nao derruba o veiculo). O campo antigo `driver_name` continua
-- existindo e sendo gravado (compatibilidade com leituras que ainda nao
-- foram migradas, ex.: relatorio PDF).
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON public.vehicles(driver_id);

-- 2) Backfill so quando a correspondencia for inequivoca: mesmo usuario,
-- nome igual (sem diferenciar maiusculas/espacos nas pontas) e exatamente UM
-- motorista com esse nome para aquele usuario. Nomes ambiguos/duplicados
-- ficam sem vinculo automatico - o usuario escolhe manualmente editando o
-- veiculo.
UPDATE public.vehicles v
SET driver_id = match.id
FROM public.drivers match
WHERE v.driver_id IS NULL
  AND v.driver_name IS NOT NULL
  AND v.user_id = match.user_id
  AND lower(trim(v.driver_name)) = lower(trim(match.name))
  AND (
    SELECT count(*) FROM public.drivers d2
    WHERE d2.user_id = v.user_id
      AND lower(trim(d2.name)) = lower(trim(v.driver_name))
  ) = 1;

-- 3) Unicidade de placa por usuario, ignorando maiusculas/espaco/traco (os
-- dois formatos de placa brasileiros - antigo e Mercosul - sao so letras e
-- numeros, sem separador formal). Indice funcional, nao precisa de coluna
-- nova. So chega aqui depois de confirmar 0 violacoes nos dados reais.
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_user_plate_normalized
  ON public.vehicles (user_id, regexp_replace(upper(plate), '[^A-Z0-9]', '', 'g'));

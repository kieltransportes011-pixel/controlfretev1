-- FASE 2 do plano de profissionalizacao da Frota: historico proprio de
-- leituras de odometro + formalizacao do "1 vencimento de revisao por
-- veiculo" numa tabela propria. Aditivo e reversivel - nao remove nenhuma
-- coluna de maintenance_logs nem apaga dado existente. Confirmado antes de
-- escrever: 1 unico vencimento por veiculo (nao varios planos), decidido
-- com o Kiel.

-- 1) Leituras de odometro: historico append-only. Uma correcao nunca
-- sobrescreve/apaga uma leitura anterior - e so uma leitura nova com
-- source='correction' e uma nota explicando o motivo.
CREATE TABLE IF NOT EXISTS public.vehicle_odometer_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  km numeric NOT NULL CHECK (km >= 0),
  reading_date date NOT NULL DEFAULT current_date,
  source text NOT NULL CHECK (source IN ('manual', 'maintenance', 'freight', 'correction')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_odometer_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own odometer readings" ON public.vehicle_odometer_readings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_odometer_readings_vehicle_id ON public.vehicle_odometer_readings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_odometer_readings_user_id ON public.vehicle_odometer_readings(user_id);

-- Backfill: uma leitura por manutencao que ja tenha KM informado - preserva
-- exatamente o historico que hoje alimenta o grafico "Evolucao de KM" (que
-- lia direto de maintenance_logs), so dando a esse dado uma casa propria.
INSERT INTO public.vehicle_odometer_readings (user_id, vehicle_id, km, reading_date, source, created_at)
SELECT user_id, vehicle_id, km_at_service, date, 'maintenance', created_at
FROM public.maintenance_logs
WHERE km_at_service IS NOT NULL;

-- 2) Plano de revisao por veiculo: 1 linha por veiculo (vehicle_id UNIQUE),
-- nao 1 por log. Formaliza o que hoje e calculado em tempo real procurando
-- "o log mais recente que tenha next_revision preenchido" - logica que hoje
-- vive duplicada no front (utils/vehicleAlerts.ts) e no cron
-- (check-vehicle-revisions), cada um escaneando maintenance_logs do zero.
CREATE TABLE IF NOT EXISTS public.vehicle_maintenance_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL UNIQUE REFERENCES public.vehicles(id) ON DELETE CASCADE,
  next_revision_km numeric,
  next_revision_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_maintenance_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own maintenance plans" ON public.vehicle_maintenance_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_plans_user_id ON public.vehicle_maintenance_plans(user_id);

-- Backfill: mesma regra que utils/vehicleAlerts.ts e o cron usam hoje (log
-- mais recente por data, entre os que tem next_revision_km ou
-- next_revision_date preenchido) - garante que nenhum alerta valendo hoje
-- muda no momento em que isso for aplicado.
INSERT INTO public.vehicle_maintenance_plans (user_id, vehicle_id, next_revision_km, next_revision_date, updated_at)
SELECT DISTINCT ON (vehicle_id)
  user_id, vehicle_id, next_revision_km, next_revision_date, created_at
FROM public.maintenance_logs
WHERE next_revision_km IS NOT NULL OR next_revision_date IS NOT NULL
ORDER BY vehicle_id, date DESC;

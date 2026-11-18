-- Finaliza o modulo de Frota: status do veiculo, motorista vinculado, e
-- a tabela de checklists de inspecao pre-viagem (grafico de KM, ranking de
-- custo por KM e export em PDF usam dados que ja existem, sem precisar de
-- schema novo).

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS driver_name text;

CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  date timestamptz NOT NULL DEFAULT now(),
  items jsonb NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own inspections" ON public.vehicle_inspections
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle_id ON public.vehicle_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_user_id ON public.vehicle_inspections(user_id);

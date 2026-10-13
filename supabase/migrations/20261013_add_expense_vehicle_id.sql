-- Vincula despesa a um veiculo da frota (opcional), mesmo padrao do
-- freights.vehicle_id ja existente. Nullable porque despesas antigas e
-- despesas sem relacao com um caminhao especifico (pedagio, alimentacao)
-- nunca vao ter esse dado.
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id ON public.expenses(vehicle_id);

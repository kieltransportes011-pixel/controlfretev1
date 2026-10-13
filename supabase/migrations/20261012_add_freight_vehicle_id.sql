-- Vincula frete a um veiculo da frota (opcional). Sem isso nao existe
-- nenhuma forma de calcular receita por caminhao - o campo e nullable
-- porque a maioria dos fretes hoje nao tem veiculo selecionado, e fretes
-- antigos nunca vao ganhar esse dado retroativamente.
ALTER TABLE public.freights
  ADD COLUMN IF NOT EXISTS vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_freights_vehicle_id ON public.freights(vehicle_id);

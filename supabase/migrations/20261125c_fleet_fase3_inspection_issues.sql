-- FASE 3 do plano de profissionalizacao da Frota: pendencias de inspecao
-- acompanhaveis. Aditiva e reversivel - nao altera vehicle_inspections nem
-- apaga nada existente.
--
-- Sem backfill de proposito: as 2 inspecoes ja existentes em producao hoje
-- sao do teste que fizemos pra diagnosticar o bug da "tela azul" (itens
-- marcados false meio aleatoriamente), nao defeitos reais - gerar
-- "pendencias abertas" a partir delas so criaria ruido. A partir de agora,
-- toda inspecao nova com item reprovado gera pendencia automaticamente.

CREATE TABLE IF NOT EXISTS public.vehicle_inspection_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  inspection_id uuid NOT NULL REFERENCES public.vehicle_inspections(id) ON DELETE CASCADE,
  item text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'media' CHECK (severity IN ('baixa', 'media', 'alta')),
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'resolvida')),
  -- Vinculo opcional a manutencao, quando a pendencia for resolvida com um
  -- servico formal (o checklist nao muda o status do veiculo
  -- automaticamente - isso fica sempre a cargo do usuario).
  maintenance_log_id uuid REFERENCES public.maintenance_logs(id) ON DELETE SET NULL,
  -- Estrutura pronta pra foto, mas NAO usada ainda: os buckets existentes no
  -- projeto (avatars, documents) sao publicos, sem controle de acesso -
  -- nao e "acesso seguro" pra foto de pendencia. Fica vazio até existir um
  -- bucket privado configurado.
  photo_url text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_inspection_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own inspection issues" ON public.vehicle_inspection_issues
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_inspection_issues_vehicle_id ON public.vehicle_inspection_issues(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_inspection_issues_inspection_id ON public.vehicle_inspection_issues(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_issues_open ON public.vehicle_inspection_issues(vehicle_id) WHERE status <> 'resolvida';

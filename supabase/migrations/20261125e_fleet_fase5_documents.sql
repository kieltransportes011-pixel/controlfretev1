-- FASE 5 do plano de profissionalizacao da Frota: vencimento de documentos
-- do veiculo (seguro, licenciamento, IPVA) e validade da CNH do motorista,
-- com janela de alerta configuravel por item (alert_days_before). Aditiva -
-- nao apaga nada. Confirmado antes de escrever: nao existia nenhum conceito
-- de vencimento de documento no projeto (CNH era so numero, sem data).
--
-- NAO inclui o agendamento do cron (pg_cron) de proposito - isso fica num
-- segundo passo, SO depois que a Edge Function check-document-expirations
-- estiver deployada (senao o cron chama uma function que nao existe ainda).

CREATE TABLE IF NOT EXISTS public.vehicle_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('seguro', 'licenciamento', 'ipva', 'outro')),
  expiry_date date NOT NULL,
  alert_days_before integer NOT NULL DEFAULT 30 CHECK (alert_days_before >= 0),
  last_alert_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own vehicle documents" ON public.vehicle_documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id ON public.vehicle_documents(vehicle_id);

-- CNH: so 1 validade por motorista, igual o padrao ja usado pra "1
-- vencimento por veiculo" - entra como coluna direto na tabela, nao numa
-- tabela separada.
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS cnh_expiry_date date,
  ADD COLUMN IF NOT EXISTS cnh_alert_days_before integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS cnh_alert_at timestamptz;

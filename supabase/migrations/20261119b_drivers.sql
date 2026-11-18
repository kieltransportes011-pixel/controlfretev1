-- Cadastro de motoristas, reaproveitavel entre veiculos. O vinculo com o
-- veiculo continua sendo so o nome (vehicles.driver_name, texto livre) -
-- selecionar um motorista daqui so preenche esse campo, sem FK, pra nao
-- quebrar nada do que ja foi shipado.
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  cnh text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own drivers" ON public.drivers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);

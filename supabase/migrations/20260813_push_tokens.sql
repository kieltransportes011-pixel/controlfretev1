-- Tabela pra guardar o "endereço" de notificação de cada aparelho.
-- Segue o mesmo padrão de RLS já usado no resto do banco.

CREATE TABLE public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null default 'android',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, token)
);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push tokens" ON public.push_tokens
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own push tokens" ON public.push_tokens
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own push tokens" ON public.push_tokens
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own push tokens" ON public.push_tokens
  FOR DELETE USING ((select auth.uid()) = user_id);

CREATE INDEX idx_push_tokens_user_id ON public.push_tokens(user_id);

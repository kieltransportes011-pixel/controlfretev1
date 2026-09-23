-- Fix: a RPC do painel admin (get_admin_users_with_freight_counts) seleciona
-- profiles.admin_notes, mas essa coluna nunca teve uma migration própria
-- nesse repo — provavelmente foi criada direto no SQL Editor durante a
-- Fase 1 e nunca ficou salva localmente. Se ela realmente não existir no
-- banco, a RPC falha em tempo de execução (a checagem só acontece na
-- primeira chamada, não na criação da função) e derruba toda a leitura do
-- painel admin em cascata. IF NOT EXISTS torna isso seguro mesmo que a
-- coluna já exista.

alter table public.profiles add column if not exists admin_notes text;

-- check_cpf_exists estava aberta pra qualquer pessoa (anon), sem login,
-- permitindo descobrir se um CPF especifico tem conta no Control Frete so
-- testando numeros - vazamento de privacidade. Revoga o acesso direto; a
-- partir de agora so a Edge Function check-cpf (com rate limit por IP)
-- consegue chamar essa RPC.
revoke execute on function public.check_cpf_exists(text) from public;
revoke execute on function public.check_cpf_exists(text) from anon;
revoke execute on function public.check_cpf_exists(text) from authenticated;

-- Log de tentativas por IP, usado pelo rate limit da Edge Function check-cpf.
-- RLS habilitada sem nenhuma policy = só a chave privilegiada (service_role)
-- consegue ler/escrever, igual outras tabelas internas do projeto.
create table if not exists public.cpf_check_attempts (
  id bigint generated always as identity primary key,
  ip_address text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_cpf_check_attempts_ip_time on public.cpf_check_attempts(ip_address, created_at);
alter table public.cpf_check_attempts enable row level security;

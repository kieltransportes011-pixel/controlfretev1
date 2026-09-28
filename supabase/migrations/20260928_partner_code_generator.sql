-- Gera um código curto (CF-XXXXX) pro usuário se identificar a um parceiro
-- físico. Alfabeto sem 0/O/1/I pra evitar erro de leitura ao ditar por
-- telefone/balcão. Guardado em profiles.partner_code (coluna nova, não
-- reaproveita referral_code — são conceitos diferentes: indicação vs.
-- identificação com parceiro, e nunca teve gerador de verdade rodando).
--
-- Usa DEFAULT de coluna em vez de editar a trigger handle_new_user(): o
-- Postgres já preenche automaticamente no INSERT que a trigger faz, do
-- mesmo jeito que preenche "id uuid default gen_random_uuid()" — zero diff
-- no fluxo de signup/login.
create or replace function public.generate_unique_partner_code()
returns text
language plpgsql
as $$
declare
  v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_exists boolean;
  v_attempts int := 0;
begin
  loop
    v_code := 'CF-';
    for i in 1..5 loop
      v_code := v_code || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    end loop;
    select exists(select 1 from public.profiles pr where pr.partner_code = v_code) into v_exists;
    exit when not v_exists;
    v_attempts := v_attempts + 1;
    if v_attempts > 20 then
      raise exception 'Não foi possível gerar um código único.';
    end if;
  end loop;
  return v_code;
end;
$$;

revoke execute on function public.generate_unique_partner_code() from public, anon, authenticated;

alter table public.profiles alter column partner_code set default public.generate_unique_partner_code();

-- Backfill: usuários existentes ainda não têm código.
update public.profiles set partner_code = public.generate_unique_partner_code() where partner_code is null;

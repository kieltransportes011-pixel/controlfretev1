
-- Function to log profile changes
create or replace function public.log_profile_changes()
returns trigger as $$
begin
    -- Check for Plan Change
    if new.plano <> old.plano or (new.plano is not null and old.plano is null) then
        insert into public.account_activity_logs (user_id, action, actor)
        values (new.id, 'Alteração de Plano: ' || coalesce(old.plano, 'none') || ' -> ' || new.plano, 'system');
    end if;

    -- Check for Status Change
    if new.account_status <> old.account_status then
        insert into public.account_activity_logs (user_id, action, actor)
        values (new.id, 'Status da conta alterado: ' || new.account_status, 'system');
    end if;

    return new;
end;
$$ language plpgsql security definer;

-- Trigger
drop trigger if exists on_profile_change_log on public.profiles;
create trigger on_profile_change_log
after update on public.profiles
for each row
execute function public.log_profile_changes();

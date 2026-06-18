-- supabase/migrations/003_trigger_new_admin.sql
--
-- Trigger tworzący wiersz w admin_profiles automatycznie po insert do
-- auth.users. Przydatny dla ścieżki "zerowego konta" operatora (skrypt
-- scripts/create-operator.ts) - normalny flow przez invite_tokens tworzy
-- wiersz w admin_profiles explicite w trakcie aktywacji (Route Handler),
-- nie przez ten trigger, więc "on conflict do nothing" zapobiega duplikatom.

create or replace function public.handle_new_admin()
returns trigger as $$
begin
  insert into public.admin_profiles (id, username, display_name, signature, is_operator)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    '',
    coalesce((new.raw_user_meta_data->>'is_operator')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_admin();

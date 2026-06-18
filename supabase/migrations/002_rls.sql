-- supabase/migrations/002_rls.sql
--
-- Row Level Security: kto może co robić na poszczególnych tabelach.

alter table public.submissions enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.invite_tokens enable row level security;

-- ---------------------------------------------------------------------
-- submissions
-- ---------------------------------------------------------------------

-- każdy (nawet niezalogowany) może WSTAWIĆ nowe zgłoszenie
create policy "anyone can insert submission"
  on public.submissions for insert
  to anon
  with check (true);

-- tylko zalogowani admini (i operator) mogą CZYTAĆ zgłoszenia
create policy "admins can select submissions"
  on public.submissions for select
  to authenticated
  using (true);

-- tylko zalogowani admini mogą AKTUALIZOWAĆ zgłoszenia
create policy "admins can update submissions"
  on public.submissions for update
  to authenticated
  using (true);

-- tylko zalogowani admini mogą USUWAĆ zgłoszenia
create policy "admins can delete submissions"
  on public.submissions for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------
-- admin_profiles
-- ---------------------------------------------------------------------

-- każdy zalogowany może czytać WŁASNY profil
create policy "admin reads own profile"
  on public.admin_profiles for select
  to authenticated
  using (auth.uid() = id);

-- operator może czytać WSZYSTKIE profile (zarządzanie adminami w /master)
create policy "operator reads all profiles"
  on public.admin_profiles for select
  to authenticated
  using (
    exists (select 1 from public.admin_profiles where id = auth.uid() and is_operator = true)
  );

-- każdy zalogowany może aktualizować WŁASNY profil (np. podpis)
create policy "admin updates own profile"
  on public.admin_profiles for update
  to authenticated
  using (auth.uid() = id);

-- operator może aktualizować dowolny profil admina
create policy "operator manages all profiles"
  on public.admin_profiles for update
  to authenticated
  using (
    exists (select 1 from public.admin_profiles where id = auth.uid() and is_operator = true)
  );

-- operator może usuwać profile adminów
create policy "operator deletes admin profiles"
  on public.admin_profiles for delete
  to authenticated
  using (
    exists (select 1 from public.admin_profiles where id = auth.uid() and is_operator = true)
  );

-- ---------------------------------------------------------------------
-- invite_tokens
-- ---------------------------------------------------------------------

-- tylko operator może tworzyć i czytać tokeny aktywacyjne
-- (with check jest wymagany dodatkowo do using, bo "for all" obejmuje też
-- insert, a Postgres RLS dla insert sprawdza with check, nie using)
create policy "operator manages invite tokens"
  on public.invite_tokens for all
  to authenticated
  using (
    exists (select 1 from public.admin_profiles where id = auth.uid() and is_operator = true)
  )
  with check (
    exists (select 1 from public.admin_profiles where id = auth.uid() and is_operator = true)
  );

-- UWAGA: weryfikacja tokenu przy aktywacji (/admin/activate/[token]) odbywa
-- się przez Route Handler z SUPABASE_SERVICE_ROLE_KEY (omija RLS), bo osoba
-- aktywująca konto nie jest jeszcze zalogowana i 'anon' nie ma żadnych praw
-- do tej tabeli - i tak powinno zostać. Patrz app/api/invite/verify/route.ts
-- i app/api/invite/activate/route.ts.

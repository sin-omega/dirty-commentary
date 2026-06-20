-- supabase/migrations/005_fix_rls_recursion.sql
--
-- NAPRAWA: policy "operator reads all profiles" / "operator manages all
-- profiles" / "operator deletes admin profiles" na admin_profiles miały
-- w swoim USING podzapytanie na TEJ SAMEJ tabeli (admin_profiles), żeby
-- sprawdzić czy auth.uid() jest operatorem. Postgres musi zastosować RLS
-- też do tego wewnętrznego podzapytania, co triggeruje tę samą policy
-- ponownie -> nieskończona rekurencja -> Postgres zwraca błąd
-- "infinite recursion detected in policy", co PostgREST raportuje jako
-- HTTP 500 dla KAŻDEGO zapytania select na admin_profiles (nawet
-- "admin reads own profile", bo Postgres ewaluuje WSZYSTKIE pasujące
-- policy razem przez OR, więc jeśli jedna z nich rekurencyjnie wybucha,
-- całe zapytanie pada, niezależnie które policy faktycznie by wystarczyło).
--
-- Rozwiązanie: funkcja pomocnicza SECURITY DEFINER, która wykonuje
-- sprawdzenie is_operator z ominięciem RLS (bo jest "security definer",
-- działa z uprawnieniami właściciela funkcji, nie wywołującego, i Postgres
-- nie stosuje RLS przy zapytaniach wewnątrz takiej funkcji w tym samym
-- sensie pętli policy->policy). To jest standardowy, zalecany przez
-- Supabase wzorzec na "czy bieżący użytkownik ma rolę X" w policy.

create or replace function public.is_current_user_operator()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and is_operator = true
  );
$$;

-- Usuń stare, rekurencyjne policy.
drop policy if exists "operator reads all profiles" on public.admin_profiles;
drop policy if exists "operator manages all profiles" on public.admin_profiles;
drop policy if exists "operator deletes admin profiles" on public.admin_profiles;

-- Odtwórz je korzystając z funkcji zamiast bezpośredniego podzapytania.
create policy "operator reads all profiles"
  on public.admin_profiles for select
  to authenticated
  using (public.is_current_user_operator());

create policy "operator manages all profiles"
  on public.admin_profiles for update
  to authenticated
  using (public.is_current_user_operator());

create policy "operator deletes admin profiles"
  on public.admin_profiles for delete
  to authenticated
  using (public.is_current_user_operator());

-- Przy okazji: policy na invite_tokens odwołuje się do admin_profiles z
-- INNEJ tabeli, więc technicznie nie powoduje tej samej bezpośredniej
-- rekurencji co powyżej, ale wciąż wykonuje zapytanie podlegające RLS na
-- admin_profiles przy każdym dostępie do invite_tokens - dla spójności
-- i wydajności (funkcja jest STABLE, może być cache'owana w obrębie
-- zapytania) też przepisujemy ją na funkcję pomocniczą.
drop policy if exists "operator manages invite tokens" on public.invite_tokens;

create policy "operator manages invite tokens"
  on public.invite_tokens for all
  to authenticated
  using (public.is_current_user_operator())
  with check (public.is_current_user_operator());

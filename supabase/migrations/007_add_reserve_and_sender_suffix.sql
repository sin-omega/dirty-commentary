-- supabase/migrations/007_add_reserve_and_sender_suffix.sql
--
-- 1. Dodanie kolumny reserved_by do tabeli submissions — pozwala adminowi
--    "zarezerwować" post dla siebie. Inni widzą pasek "zarezerwowane dla X".
-- 2. Dodanie kolumny sender_suffix do admin_profiles — konfigurowalny
--    sufiks automatycznie doklejany na końcu wiadomości, np.
--    "(screen od %sender%)" gdzie %sender% to ksywka wysyłającego.
-- 3. Rozszerzenie enum submission_status o 'reserved'.
-- 4. RLS: authenticated może czytać i aktualizować reserved_by.

alter type submission_status add value if not exists 'reserved';

alter table public.submissions
  add column if not exists reserved_by uuid references auth.users(id) on delete set null;

-- anon nie widzi reserved_by (insert dalej z with check true)
create policy "admins can update reserved_by"
  on public.submissions for update
  to authenticated
  using (true)
  with check (true);

alter table public.admin_profiles
  add column if not exists sender_suffix text not null default '';

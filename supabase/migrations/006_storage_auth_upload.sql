-- supabase/migrations/006_storage_auth_upload.sql
--
-- Uzupełnienie brakującej polityki RLS dla uploadu do bucketa
-- 'submissions'. Powód: formularz zgłoszeń (SubmissionForm) używa
-- createClient() z anon key, ale jeśli użytkownik jest zalogowany
-- jako admin i nawiguje na stronę publiczną, Supabase nadpisuje
-- rolę na 'authenticated'. Bez tej polityki upload z rolem
-- authenticated kończy się błędem 403 "new row violates
-- row-level security policy".

create policy "authenticated can upload submission images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'submissions');

-- To samo dla tabeli submissions: insert był dozwolony tylko dla anon.
-- Zalogowany admin wchodzący na stronę publiczną ma rolę 'authenticated'
-- i bez tej polityki dostaje RLS violation przy .from('submissions').insert().
create policy "authenticated can insert submission"
  on public.submissions for insert
  to authenticated
  with check (true);

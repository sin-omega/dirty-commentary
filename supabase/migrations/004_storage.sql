-- supabase/migrations/004_storage.sql
--
-- Supabase Storage: bucket 'submissions' (prywatny) + policies.
-- UWAGA: ten plik tworzy bucket przez insert do storage.buckets, co działa
-- w SQL Editor. Alternatywnie możesz stworzyć bucket ręcznie w Dashboardzie
-- (Storage -> New bucket -> nazwa "submissions", Public = OFF) i pominąć
-- pierwszy insert poniżej.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submissions',
  'submissions',
  false,
  10485760, -- 10 MB
  array['image/png', 'image/jpeg', 'image/heic', 'image/webp']
)
on conflict (id) do nothing;

-- anon może wgrywać, nie może czytać/listować
create policy "anon can upload submission images"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'submissions');

-- zalogowani admini mogą czytać zdjęcia (przez signed URL)
create policy "authenticated can read submission images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'submissions');

-- zalogowani admini mogą usuwać zdjęcia (np. razem z usunięciem zgłoszenia)
create policy "authenticated can delete submission images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'submissions');

# wpadka commentary

Aplikacja webowa do zbierania i komentowania "wpadek" — każdy może wysłać zrzut ekranu swojej własnej niezręcznej sytuacji, admini piszą do tego zabawny komentarz i wklejają na WhatsApp.

Stack: Next.js 14 (App Router) + Supabase (Postgres, Auth, Storage) + Tailwind CSS, hostowane na Vercel.

---

## 0. Czego będziesz potrzebować

- Konto na [supabase.com](https://supabase.com) (darmowy plan wystarczy na start)
- Konto na [vercel.com](https://vercel.com) (darmowy plan wystarczy)
- Konto na [github.com](https://github.com)
- Node.js 20+ zainstalowany lokalnie ([nodejs.org](https://nodejs.org)) — potrzebny tylko do testowania lokalnego i odpalenia skryptu bootstrapowego
- Git zainstalowany lokalnie

Cała instrukcja zakłada, że nie miałeś/aś wcześniej do czynienia z żadnym z tych narzędzi — idź krok po kroku, nic nie pomijaj.

---

## 1. Wrzucenie kodu na GitHub

1. Rozpakuj folder z projektem (jeśli dostałeś go jako .zip) gdziekolwiek na swoim komputerze.
2. Otwórz terminal (na Mac: Terminal, na Windows: PowerShell albo Git Bash) i wejdź do folderu projektu:
   ```bash
   cd ścieżka/do/wpadka-commentary
   ```
3. Zainicjuj repozytorium Git i zrób pierwszy commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - wpadka commentary"
   ```
4. Wejdź na [github.com/new](https://github.com/new) i stwórz nowe, **prywatne** repozytorium (np. `wpadka-commentary`). Nie zaznaczaj żadnej opcji typu "Add README" — masz już swój kod.
5. GitHub pokaże Ci komendy do połączenia lokalnego repo ze zdalnym — będą wyglądać podobnie do:
   ```bash
   git remote add origin https://github.com/TWOJA-NAZWA/wpadka-commentary.git
   git branch -M main
   git push -u origin main
   ```
   Wklej je do terminala (w folderze projektu) i wykonaj.
6. Odśwież stronę repozytorium na GitHubie — powinieneś/powinnaś zobaczyć wszystkie pliki projektu.

---

## 2. Konfiguracja Supabase

### 2.1 Stwórz projekt

1. Wejdź na [supabase.com/dashboard](https://supabase.com/dashboard) i zaloguj się.
2. Kliknij **New project**.
3. Wybierz organizację (albo stwórz nową), podaj nazwę projektu (np. `wpadka-commentary`), wygeneruj silne hasło do bazy danych (zapisz je sobie gdzieś bezpiecznie — to hasło do samej bazy Postgres, nie do logowania w aplikacji) i wybierz region najbliższy Twoim użytkownikom (np. Frankfurt dla Polski).
4. Kliknij **Create new project** i zaczekaj 1-2 minuty, aż projekt się utworzy.

### 2.2 Uruchom migracje SQL

1. W panelu projektu po lewej stronie kliknij **SQL Editor**.
2. Otwórz w projekcie folder `supabase/migrations/` — znajdziesz tam 4 pliki ponumerowane `001` do `004`.
3. Dla **każdego pliku po kolei** (zaczynając od `001_tables.sql`):
   - Otwórz plik w edytorze tekstu, zaznacz całą zawartość i skopiuj.
   - Wklej do SQL Editora w Supabase.
   - Kliknij **Run** (albo Ctrl+Enter / Cmd+Enter).
   - Sprawdź, że nie ma błędu (zielony komunikat "Success" na dole).
4. Powtórz dla `002_rls.sql`, `003_trigger_new_admin.sql`, `004_storage.sql` — **w tej kolejności**, bo każdy kolejny plik zakłada, że poprzednie już zostały uruchomione.

Jeśli plik `004_storage.sql` zwróci błąd przy tworzeniu bucketu (czasem insert do `storage.buckets` przez SQL Editor jest zablokowany w niektórych planach), zrób to ręcznie:
- Przejdź do **Storage** w menu po lewej.
- Kliknij **New bucket**, nazwa: `submissions`, **Public bucket: OFF** (ważne — zdjęcia muszą być prywatne).
- File size limit: `10485760` (10 MB), Allowed MIME types: `image/png,image/jpeg,image/heic,image/webp`.
- Wróć do SQL Editora i uruchom tylko część `004_storage.sql` zaczynającą się od `create policy` (czyli wszystko poza pierwszym `insert into storage.buckets`).

### 2.3 Skopiuj dane do połączenia z aplikacją

1. W panelu Supabase przejdź do **Project Settings** (ikona zębatki) → **API**.
2. Zanotuj sobie trzy wartości:
   - **Project URL** (wygląda jak `https://xxxxxxxxxxx.supabase.co`)
   - **anon public** key (długi string w sekcji "Project API keys")
   - **service_role** key (też w tej sekcji — **NIGDY nie wklejaj tego nigdzie publicznie, nie commituj do Gita, nie wysyłaj nikomu**, to klucz z pełnym dostępem do bazy)

Będziesz ich potrzebować w kroku 4 (zmienne środowiskowe).

---

## 3. Konfiguracja kanału WhatsApp

Jeśli masz już kanał WhatsApp, do którego chcesz linkować z przycisku na stronie głównej:

1. Otwórz WhatsApp, wejdź w swój kanał.
2. Skopiuj link do kanału (zwykle z opcji "Udostępnij kanał" albo z informacji o kanale) — wygląda jak `https://whatsapp.com/channel/0029VaXXXXXXXXXXXXXXXX`.
3. Zapisz ten link — przyda się w następnym kroku.

Jeśli nie masz jeszcze kanału, możesz pominąć ten krok i wpisać link później — bez niego przycisk po prostu nie wyświetli się na stronie (zgodnie z projektem aplikacji).

---

## 4. Pierwsze uruchomienie lokalne (test przed wdrożeniem)

Ten krok jest opcjonalny, ale **bardzo polecany** — pozwala sprawdzić, że wszystko działa, zanim wdrożysz na produkcję, i jest niezbędny do stworzenia pierwszego konta operatora (krok 5).

1. W folderze projektu skopiuj plik `.env.local.example` i nazwij kopię `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
2. Otwórz `.env.local` w edytorze tekstu i wypełnij wartościami z Supabase (krok 2.3):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=twoj-anon-key
   SUPABASE_SERVICE_ROLE_KEY=twoj-service-role-key
   NEXT_PUBLIC_WHATSAPP_CHANNEL_URL=https://whatsapp.com/channel/twoj-kanal
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
3. Zainstaluj zależności:
   ```bash
   npm install
   ```
4. Uruchom serwer deweloperski:
   ```bash
   npm run dev
   ```
5. Otwórz [http://localhost:3000](http://localhost:3000) w przeglądarce — powinieneś/powinnaś zobaczyć stronę publiczną z formularzem.
6. (Opcjonalnie) Uruchom testy jednostkowe parsera WhatsApp markdown:
   ```bash
   npm run test
   ```
   Wszystkie testy powinny przejść (zielone "PASS").

---

## 5. Stworzenie pierwszego konta operatora

Operator to specjalna rola, która generuje linki aktywacyjne dla adminów i zarządza nimi w panelu `/master`. Pierwsze konto operatora trzeba stworzyć ręcznie skryptem (nie ma formularza rejestracji — to świadoma decyzja projektowa, patrz sekcja 12 specyfikacji).

1. Upewnij się, że masz wypełniony `.env.local` (krok 4.2).
2. W terminalu, w folderze projektu, uruchom:
   ```bash
   npm run create-operator -- --username=operator --password=twoje-bezpieczne-haslo --displayName=Operator
   ```
   Zamień `operator`, `twoje-bezpieczne-haslo` i `Operator` na swoje wartości. Hasło musi mieć min. 8 znaków. Login (`username`) to to, czym będziesz się logować — zapamiętaj je.
3. Powinieneś/powinnaś zobaczyć komunikat `✅ Konto operatora utworzone!`.
4. Przejdź na `http://localhost:3000/admin/login` i zaloguj się tym loginem i hasłem — powinieneś/powinnaś trafić do panelu `/master`.

Jeśli coś nie zadziała, sprawdź w Supabase: **Authentication** → **Users** czy konto się pojawiło, i **Table Editor** → `admin_profiles` czy jest tam wiersz z `is_operator = true`.

---

## 6. Wdrożenie na Vercel

1. Wejdź na [vercel.com/new](https://vercel.com/new) i zaloguj się (możesz użyć konta GitHub).
2. Kliknij **Import Project** / **Add New → Project**.
3. Połącz swoje konto GitHub jeśli jeszcze nie jest połączone, znajdź repozytorium `wpadka-commentary` i kliknij **Import**.
4. Vercel powinien automatycznie wykryć, że to projekt Next.js — nie zmieniaj domyślnych ustawień build.
5. **Zanim klikniesz Deploy**, rozwiń sekcję **Environment Variables** i dodaj te same zmienne co w `.env.local`:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Twój Project URL z Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Twój anon key z Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | Twój service role key z Supabase |
   | `NEXT_PUBLIC_WHATSAPP_CHANNEL_URL` | Link do Twojego kanału WhatsApp |
   | `NEXT_PUBLIC_APP_URL` | (na razie wpisz placeholder, np. `https://placeholder.vercel.app` — poprawisz w kroku 7) |

6. Kliknij **Deploy** i zaczekaj 1-3 minuty.
7. Po zakończeniu Vercel pokaże Ci adres Twojej aplikacji, np. `https://wpadka-commentary-xyz.vercel.app`.

---

## 7. Dokończenie konfiguracji po wdrożeniu

1. Skopiuj prawdziwy adres aplikacji z Vercel (z kroku 6.7).
2. Wróć do ustawień projektu na Vercel: **Settings** → **Environment Variables**, znajdź `NEXT_PUBLIC_APP_URL` i zmień wartość na prawdziwy adres (np. `https://wpadka-commentary-xyz.vercel.app`), bez ukośnika na końcu.
3. Przejdź do zakładki **Deployments**, kliknij "..." przy najnowszym wdrożeniu i wybierz **Redeploy** (zmienne środowiskowe wymagają nowego buildu, żeby się załadować).
4. Otwórz swój adres produkcyjny w przeglądarce i sprawdź, że strona główna się wyświetla.
5. Zaloguj się na `/admin/login` kontem operatora stworzonym w kroku 5 — powinno zadziałać identycznie jak lokalnie, bo używa tej samej bazy Supabase.

**Ważne o bezpieczeństwie Supabase**: domyślnie Supabase nie ogranicza, z jakich domen można korzystać z anon key, ale jeśli chcesz dodatkowo zawęzić dostęp do Auth, możesz w Supabase wejść w **Authentication → URL Configuration** i ustawić **Site URL** na adres produkcyjny z Vercel — to kontroluje, dokąd Supabase przekierowuje po pewnych akcjach auth (w tym MVP nie używamy redirectów email, więc nie jest to krytyczne, ale dobra praktyka).

---

## 8. Zapraszanie adminów

Teraz, gdy masz działającą aplikację z kontem operatora:

1. Zaloguj się jako operator na `/admin/login`.
2. Przejdziesz automatycznie do `/master`.
3. Kliknij **wygeneruj nowy link** w sekcji "linki aktywacyjne".
4. Kliknij **kopiuj link** przy nowo wygenerowanym wierszu.
5. Wyślij ten link osobie, którą chcesz dodać jako admina (np. wiadomością prywatną) — link jest jednorazowy i wygasa po 48h.
6. Osoba klika link, sama wybiera swój login, wyświetlaną nazwę i hasło, i od razu może się zalogować na `/admin/login`.
7. Po zalogowaniu nowy admin może ustawić swój podpis w **ustawieniach** (ikona zębatki w prawym górnym rogu panelu) — ten podpis będzie automatycznie doklejany do każdego komentarza, który skopiuje do WhatsApp.

---

## 9. Codzienne korzystanie z aplikacji

- **Użytkownicy** wchodzą na stronę główną (np. `https://wpadka-commentary-xyz.vercel.app`), wybierają zdjęcie swojej wpadki, wpisują ksywkę i opcjonalnie link, i wysyłają — bez logowania.
- **Admini** logują się na `/admin/login`, widzą kolejkę zgłoszeń, klikają kartę, piszą komentarz (z formatowaniem WhatsApp i zmiennymi `%sender%` / `%channel_link%`), i albo zaplanowują wysyłkę na później, albo kopiują tekst do schowka (co automatycznie oznacza zgłoszenie jako "omówione") i wklejają ręcznie na WhatsApp.
- **Operator** dodatkowo zarządza linkami aktywacyjnymi i listą adminów w `/master`.

---

## 10. Zmiana tekstów / nazwy aplikacji

Wszystkie teksty widoczne w UI (nazwa aplikacji, treści przycisków, komunikaty) znajdują się w jednym pliku: `lib/dictionary.ts`. Żeby zmienić np. nazwę z "wpadka commentary" na coś innego:

1. Otwórz `lib/dictionary.ts`.
2. Zmień wartość `brand.name` (i ewentualnie `brand.titleAccent`, jeśli chcesz inny fragment podświetlony kolorem).
3. Zacommituj zmianę i wypchnij na GitHub (`git add . && git commit -m "Zmiana nazwy" && git push`) — Vercel automatycznie zbuduje i wdroży nową wersję.

Każdy inny tekst (np. treść przycisku "wyślij wpadkę") zmienia się analogicznie — znajdź odpowiednie pole w `lib/dictionary.ts`, zmień wartość, zacommituj.

---

## 11. Rozwiązywanie problemów

**"nieprawidłowy login lub hasło" mimo poprawnych danych**
Sprawdź w Supabase → Authentication → Users, czy konto istnieje i ma `email_confirmed_at` wypełnione. Jeśli konto powstało przez skrypt `create-operator`, powinno być automatycznie potwierdzone.

**Zdjęcia się nie wyświetlają w panelu admina**
Sprawdź w Supabase → Storage, czy bucket `submissions` istnieje i czy są w nim pliki. Sprawdź też w SQL Editorze, czy policy ze storage (`004_storage.sql`) zostały zastosowane: `select * from pg_policies where tablename = 'objects';`.

**Link aktywacyjny mówi "link jest nieprawidłowy"**
Sprawdź, czy `NEXT_PUBLIC_APP_URL` w zmiennych środowiskowych Vercel jest poprawnie ustawiony na prawdziwy adres aplikacji (krok 7.2) i czy zrobiłeś/aś redeploy po jego zmianie.

**Błąd przy `npm install`**
Sprawdź, czy masz Node.js w wersji 20 lub nowszej: `node -v`.

**Coś innego nie działa**
Sprawdź zakładkę **Logs** w panelu Vercel (Deployments → wybierz wdrożenie → Logs) oraz **Logs** w Supabase (sekcja Logs po lewej) — tam zobaczysz dokładne komunikaty błędów.

---

## Struktura projektu (dla zainteresowanych / do dalszego rozwoju)

```
app/                    - strony i route handlers Next.js (App Router)
  page.tsx              - strona publiczna /
  admin/                - panel admina (chroniony przez middleware.ts)
  master/                - panel operatora
  api/invite/           - route handlers do tworzenia/weryfikacji/aktywacji tokenów
components/
  public/               - komponenty strony publicznej
  admin/                - komponenty panelu admina
  ui/                   - wspólne komponenty UI (Button, Card, Toast...)
lib/
  dictionary.ts         - WSZYSTKIE teksty UI w jednym miejscu
  whatsapp-format.ts    - parser formatowania WhatsApp + podstawianie zmiennych
  textarea-formatting.ts- logika toolbar formatowania (bold/italic/listy...)
  supabase/             - kliencji Supabase (client/server/admin)
supabase/migrations/    - migracje SQL do uruchomienia w Supabase SQL Editor
scripts/create-operator.ts - skrypt bootstrapowy pierwszego konta operatora
tests/                  - testy jednostkowe (Vitest)
```

Pełna specyfikacja funkcjonalna, która była podstawą budowy tej aplikacji, opisuje dodatkowo niuanse projektowe (np. dlaczego podpis przy kopiowaniu pochodzi od osoby kopiującej, nie od autora treści) — warto do niej wrócić, jeśli planujesz rozbudowę.
# dirty-commentary

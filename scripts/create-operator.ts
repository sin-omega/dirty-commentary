// scripts/create-operator.ts
//
// Skrypt do jednorazowego uruchomienia LOKALNIE, do stworzenia pierwszego
// ("zerowego") konta operatora, zanim cokolwiek innego istnieje w systemie.
// Po tym jak pierwszy operator istnieje, kolejne konta (adminów i ewentualnie
// dodatkowych operatorów) twórz przez link aktywacyjny z /master.
//
// Użycie:
//   1. Upewnij się, że .env.local zawiera NEXT_PUBLIC_SUPABASE_URL
//      i SUPABASE_SERVICE_ROLE_KEY (z Supabase Dashboard -> Settings -> API).
//   2. npm run create-operator -- --username=operator --password=twoje-haslo --displayName=Operator
//
// Hasło podane w argumencie jest tymczasowe - zaloguj się i (jeśli kiedyś
// dodamy taką opcję) zmień je, albo po prostu pamiętaj je bezpiecznie.

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { usernameToInternalEmail, isValidUsername, normalizeUsername } from '../lib/auth-helpers';

function parseArgs(): { username: string; password: string; displayName: string } {
  const args = process.argv.slice(2);
  const parsed: Record<string, string> = {};

  for (const arg of args) {
    const match = arg.match(/^--([a-zA-Z]+)=(.*)$/);
    if (match) parsed[match[1]] = match[2];
  }

  const username = parsed.username;
  const password = parsed.password;
  const displayName = parsed.displayName ?? username;

  if (!username || !password) {
    console.error(
      'Użycie: npm run create-operator -- --username=operator --password=haslo123 --displayName=Operator'
    );
    process.exit(1);
  }

  return { username, password, displayName };
}

async function main() {
  const { username, password, displayName } = parseArgs();

  const normalizedUsername = normalizeUsername(username);

  if (!isValidUsername(normalizedUsername)) {
    console.error('Login musi mieć 3-30 znaków: litery, cyfry, podkreślenie.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Hasło musi mieć minimum 8 znaków.');
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      'Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY w .env.local'
    );
    process.exit(1);
  }

  const supabaseAdmin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: usernameToInternalEmail(normalizedUsername),
    password,
    email_confirm: true,
    user_metadata: {
      username: normalizedUsername,
      display_name: displayName,
      is_operator: true,
    },
  });

  if (error) {
    console.error('Błąd podczas tworzenia konta:', error.message);
    process.exit(1);
  }

  console.log('✅ Konto operatora utworzone!');
  console.log(`   Login: ${normalizedUsername}`);
  console.log(`   Wyświetlana nazwa: ${displayName}`);
  console.log(`   User ID: ${data.user?.id}`);
  console.log('');
  console.log('Zaloguj się na /admin/login tym loginem i podanym hasłem.');
  console.log(
    'Trigger SQL (on_auth_user_created) powinien automatycznie stworzyć wiersz w admin_profiles.'
  );
}

main();

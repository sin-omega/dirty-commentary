// lib/auth-helpers.ts
//
// Supabase Auth jest natywnie zbudowany wokół emaila (auth.users.email jest
// wymagane). Żeby admini logowali się samym loginem i hasłem (bez widocznego
// adresu email w UI), każde konto dostaje techniczny adres w formacie
// `${username}@internal.wpadkacommentary.local` zapisany w auth.users.email,
// ale nigdy pokazywany w żadnym formularzu czy ekranie.

const INTERNAL_EMAIL_DOMAIN = 'internal.wpadkacommentary.local';

export function usernameToInternalEmail(username: string): string {
  return `${username.toLowerCase().trim()}@${INTERNAL_EMAIL_DOMAIN}`;
}

export function isInternalEmail(email: string): boolean {
  return email.endsWith(`@${INTERNAL_EMAIL_DOMAIN}`);
}

export function internalEmailToUsername(email: string): string {
  return email.split('@')[0];
}

// Walidacja loginu: 3-30 znaków, tylko litery, cyfry, podkreślenie.
const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username.toLowerCase().trim());
}

export function normalizeUsername(username: string): string {
  return username.toLowerCase().trim();
}

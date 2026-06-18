// lib/supabase/client.ts
//
// Klient Supabase do użycia w komponentach klienckich ('use client').
// Używa anon key — respektuje RLS.

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

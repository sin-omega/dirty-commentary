// lib/supabase/server.ts
//
// Klient Supabase do użycia w Server Components, Server Actions i Route
// Handlers. Czyta/zapisuje sesję z cookies. Używa anon key — respektuje RLS.

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/database.types';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Wywoływane z Server Component bez możliwości zapisu cookies —
            // middleware.ts i tak odświeży sesję, można bezpiecznie zignorować.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // patrz komentarz wyżej
          }
        },
      },
    }
  );
}

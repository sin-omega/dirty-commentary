// lib/supabase/admin.ts
//
// Klient Supabase z SERVICE ROLE KEY. Omija RLS całkowicie.
// UŻYWAĆ WYŁĄCZNIE w Route Handlers / skryptach server-side, NIGDY w kodzie
// dostępnym dla klienta. Ten plik nie ma dyrektywy 'use client' i nie powinien
// być importowany w żadnym komponencie klienckim.

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY w zmiennych środowiskowych.'
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

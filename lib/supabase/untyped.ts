// lib/supabase/untyped.ts
//
// Pomocnicza funkcja do obejścia znanego problemu z wnioskowaniem przeciążeń
// insert/upsert/update w postgrest-js przy niektórych kombinacjach wersji
// TypeScript / @supabase/supabase-js / @supabase/ssr: mimo poprawnie
// zdefiniowanego typu Database (z Relationships, Views, Functions, Enums,
// CompositeTypes - zgodnie z tym co generuje oficjalne `supabase gen types`),
// query buildery dla insert/update/upsert potrafią zawężać parametr do
// 'never', mimo że select/single/maybeSingle na tym samym kliencie działają
// poprawnie.
//
// asUntyped() rzutuje dowolnego, w pełni typowanego klienta Supabase na jego
// "schema-less" wariant (SupabaseClient<any, any, any>), dla którego
// postgrest-js stosuje swój fallback bez ścisłego wnioskowania z Database -
// insert/update/upsert przyjmują wtedy zwykły Record<string, unknown>.
// Poprawność kształtu danych jest pilnowana przez jawne typy (np.
// AdminProfileInsert/AdminProfileUpdate z lib/database.types.ts) podawane
// jako adnotacja na obiekcie przekazywanym do .insert()/.update(), a nie
// przez wnioskowanie z klienta.
//
// Używać WYŁĄCZNIE bezpośrednio przed .insert()/.update()/.upsert() - dla
// select/single/maybeSingle używać normalnego, typowanego klienta (te
// działają poprawnie i dają autouzupełnianie/sprawdzanie nazw kolumn).

import type { SupabaseClient } from '@supabase/supabase-js';

export function asUntyped<T>(client: T): SupabaseClient {
  return client as unknown as SupabaseClient;
}

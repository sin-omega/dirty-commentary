// app/admin/page.tsx
import { createClient } from '@/lib/supabase/server';
import { AdminQueueClient } from '@/components/admin/AdminQueueClient';

export default async function AdminQueuePage() {
  const supabase = createClient();

  // Liczba przeterminowanych zaplanowanych postów - dla bannera (sekcja 5.1).
  const { count: overdueCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'scheduled')
    .lte('scheduled_for', new Date().toISOString());

  return <AdminQueueClient initialOverdueCount={overdueCount ?? 0} />;
}

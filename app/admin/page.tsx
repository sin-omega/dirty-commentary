// app/admin/page.tsx
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { AdminQueueClient } from '@/components/admin/AdminQueueClient';

export default async function AdminQueuePage() {
  const supabase = createClient();

  // Liczba przeterminowanych zaplanowanych postów - dla bannera.
  const { count: overdueCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'scheduled')
    .lte('scheduled_for', new Date().toISOString());

  return (
    <Suspense fallback={<div className="flex h-16 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-bg-ink border-t-transparent" /></div>}>
      <AdminQueueClient initialOverdueCount={overdueCount ?? 0} />
    </Suspense>
  );
}

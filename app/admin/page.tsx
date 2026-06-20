// app/admin/page.tsx
import { Suspense } from 'react';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/server';
import { AdminQueueClient } from '@/components/admin/AdminQueueClient';

export default async function AdminQueuePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { count: overdueCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'scheduled')
    .lte('scheduled_for', new Date().toISOString());

  let myUserId = '';
  let senderSuffix = '';
  if (user) {
    try {
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('id, sender_suffix')
        .eq('id', user.id)
        .single<{ id: string; sender_suffix: string }>();
      myUserId = profile?.id ?? '';
      senderSuffix = profile?.sender_suffix ?? '';
    } catch { /* ignore */ }
  }

  return (
    <Suspense fallback={<div className="flex h-16 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-bg-ink border-t-transparent" /></div>}>
      <AdminQueueClient initialOverdueCount={overdueCount ?? 0} initialMyUserId={myUserId} initialSenderSuffix={senderSuffix} />
    </Suspense>
  );
}

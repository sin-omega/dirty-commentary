// app/admin/settings/page.tsx
import { redirect } from 'next/navigation';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/server';
import { asUntyped } from '@/lib/supabase/untyped';
import { SettingsForm } from '@/components/admin/SettingsForm';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  let rawData: Record<string, unknown> | null = null;
  try {
    const result = await asUntyped(supabase)
      .from('admin_profiles')
      .select('username, display_name, signature, is_operator, sender_suffix')
      .eq('id', user.id)
      .single();
    rawData = result.data;
  } catch {
    redirect('/admin/login');
  }

  if (!rawData) redirect('/admin/login');

  return (
    <div>
      <h1 className="mb-5 text-center font-display text-2xl font-bold text-bg-ink">
        {dictionary.settings.title}
      </h1>
      <SettingsForm
        username={String(rawData.username ?? '')}
        displayName={String(rawData.display_name ?? '')}
        initialSignature={String(rawData.signature ?? '')}
        initialSenderSuffix={String(rawData.sender_suffix ?? '')}
        userId={user.id}
      />
    </div>
  );
}

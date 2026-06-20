// app/admin/settings/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/admin/SettingsForm';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');

  let profile: { username: string; display_name: string; signature: string } | null = null;
  try {
    const result = await supabase
      .from('admin_profiles')
      .select('username, display_name, signature')
      .eq('id', user.id)
      .single<{ username: string; display_name: string; signature: string }>();
    profile = result.data;
  } catch {
    // Błąd zapytania profilu — przekieruj do loginu.
    redirect('/admin/login');
  }

  if (!profile) redirect('/admin/login');

  return (
    <div>
      <div className="mx-auto mb-5 max-w-lg">
        <Link href="/admin" className="text-sm text-bg-ink/50 hover:text-bg-ink/80">
          {dictionary.settings.backCta}
        </Link>
      </div>
      <h1 className="mb-5 text-center font-display text-2xl font-bold text-bg-ink">
        {dictionary.settings.title}
      </h1>
      <SettingsForm
        username={profile.username}
        displayName={profile.display_name}
        initialSignature={profile.signature}
        userId={user.id}
      />
    </div>
  );
}

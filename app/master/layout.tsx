// app/master/layout.tsx
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { dictionary, splitBrandName } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/admin/LogoutButton';

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const { baseName, accent } = splitBrandName();

  let displayName = '';
  if (session) {
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('display_name')
      .eq('id', session.user.id)
      .single<{ display_name: string }>();
    displayName = profile?.display_name ?? '';
  }

  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-bg-page">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-bg-ink bg-white px-4 py-3">
        <Link href="/admin" className="font-display text-lg font-bold text-bg-ink">
          {baseName}
          <span className="text-accent">{accent}</span>
        </Link>

        <div className="flex items-center gap-2">
          {displayName && (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-bg-ink bg-accent-soft text-sm font-bold text-accent"
              title={displayName}
            >
              {initials}
            </span>
          )}
          <Link
            href="/admin/settings"
            className="touch-target flex items-center justify-center rounded-full text-bg-ink/60 hover:bg-black/5 hover:text-bg-ink"
            title={dictionary.adminQueue.settingsCta}
          >
            <Settings size={20} />
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="px-4 py-5">{children}</div>
    </div>
  );
}

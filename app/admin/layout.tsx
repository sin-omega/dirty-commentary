// app/admin/layout.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { dictionary, splitBrandName } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/admin/LogoutButton';
import { PanelSwitch } from '@/components/admin/PanelSwitch';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { baseName, accent } = splitBrandName();

  let displayName = '';
  let isOperator = false;
  if (user) {
    try {
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('display_name, is_operator')
        .eq('id', user.id)
        .single<{ display_name: string; is_operator: boolean }>();
      displayName = profile?.display_name ?? '';
      isOperator = profile?.is_operator === true;
    } catch {
      displayName = '';
      isOperator = false;
    }
  }

  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg-page">
      <header className="flex shrink-0 items-center justify-between border-b-2 border-bg-ink bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <Link href="/" className="shrink-0 font-display text-lg font-bold text-bg-ink">
            {baseName}
            <span className="text-accent">{accent}</span>
          </Link>
          <Suspense fallback={null}>
            <PanelSwitch isOperator={isOperator} />
          </Suspense>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {displayName && (
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-bg-ink bg-accent-soft text-sm font-bold text-accent"
              title={displayName}
            >
              {initials}
            </span>
          )}
          <LogoutButton />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5">{children}</div>
    </div>
  );
}

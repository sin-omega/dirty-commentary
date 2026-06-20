// components/admin/PanelSwitch.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dictionary } from '@/lib/dictionary';

interface PanelSwitchProps {
  activePath: '/admin' | '/master';
}

export function PanelSwitch({ activePath }: PanelSwitchProps) {
  const pathname = usePathname();

  // Na podstronach (np. /admin/settings) traktujemy jako aktywny tab główny
  const isAdminActive = pathname.startsWith('/admin');
  const isMasterActive = pathname.startsWith('/master');

  return (
    <div className="flex gap-1 rounded-pill bg-bg-ink/5 p-0.5">
      <Link
        href="/admin"
        className={`rounded-pill px-3 py-1 text-xs font-semibold transition-colors ${
          isAdminActive
            ? 'bg-bg-ink text-white'
            : 'text-bg-ink/50 hover:text-bg-ink'
        }`}
      >
        {dictionary.master.tabQueue}
      </Link>
      <Link
        href="/master"
        className={`rounded-pill px-3 py-1 text-xs font-semibold transition-colors ${
          isMasterActive
            ? 'bg-bg-ink text-white'
            : 'text-bg-ink/50 hover:text-bg-ink'
        }`}
      >
        {dictionary.master.tabMaster}
      </Link>
    </div>
  );
}

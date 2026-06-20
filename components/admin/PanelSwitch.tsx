// components/admin/PanelSwitch.tsx
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Settings, ShieldCheck } from 'lucide-react';
import { dictionary } from '@/lib/dictionary';

interface PanelSwitchProps {
  isOperator: boolean;
}

export function PanelSwitch({ isOperator }: PanelSwitchProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = pathname === '/admin' ? (searchParams.get('tab') || 'pending') : null;

  function isActive(check: string): boolean {
    if (check === 'pending') return pathname === '/admin' && currentTab === 'pending';
    if (check === 'scheduled') return pathname === '/admin' && currentTab === 'scheduled';
    if (check === 'done') return pathname === '/admin' && currentTab === 'done';
    if (check === 'master') return pathname.startsWith('/master');
    if (check === 'settings') return pathname === '/admin/settings';
    return false;
  }

  function cls(active: boolean): string {
    return `shrink-0 rounded-pill px-3 py-1 text-xs font-semibold transition-colors ${
      active ? 'bg-bg-ink text-white' : 'text-bg-ink/50 hover:text-bg-ink'
    }`;
  }

  return (
    <div className="flex gap-1 overflow-x-auto rounded-pill bg-bg-ink/5 p-0.5">
      <Link href="/admin" className={cls(isActive('pending'))}>
        {dictionary.adminQueue.tabPending}
      </Link>
      <Link href="/admin?tab=scheduled" className={cls(isActive('scheduled'))}>
        {dictionary.adminQueue.tabScheduledShort}
      </Link>
      <Link href="/admin?tab=done" className={cls(isActive('done'))}>
        {dictionary.adminQueue.tabDoneShort}
      </Link>
      {isOperator && (
        <Link href="/master" className={cls(isActive('master'))}>
          <span className="flex items-center gap-1">
            <ShieldCheck size={12} />
            {dictionary.master.tabMaster}
          </span>
        </Link>
      )}
      <Link href="/admin/settings" className={cls(isActive('settings'))}>
        <span className="flex items-center gap-1">
          <Settings size={12} />
          {dictionary.adminQueue.settingsCta}
        </span>
      </Link>
    </div>
  );
}

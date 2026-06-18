// components/admin/OverdueBanner.tsx
'use client';

import { Bell } from 'lucide-react';
import { dictionary } from '@/lib/dictionary';

interface OverdueBannerProps {
  count: number;
  onViewClick: () => void;
}

export function OverdueBanner({ count, onViewClick }: OverdueBannerProps) {
  if (count <= 0) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-card border-2 border-scheduled-border bg-scheduled px-4 py-3">
      <Bell size={18} className="shrink-0 text-bg-ink/70" />
      <span className="flex-1 text-sm font-medium text-bg-ink">
        {dictionary.adminQueue.bannerOverdue(count)}
      </span>
      <button
        onClick={onViewClick}
        className="touch-target shrink-0 rounded-pill border-2 border-bg-ink bg-white px-4 py-1.5 text-sm font-semibold text-bg-ink hover:bg-accent-soft"
      >
        {dictionary.adminQueue.bannerCta}
      </button>
    </div>
  );
}

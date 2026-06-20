// components/admin/SubmissionCard.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { User, Link2, MoreHorizontal, Trash2, SkipForward, Lock } from 'lucide-react';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { asUntyped } from '@/lib/supabase/untyped';
import { formatRelativeTime } from '@/lib/format-time';
import type { Submission } from '@/lib/database.types';
import { Card } from '@/components/ui/Card';

interface SubmissionCardProps {
  submission: Submission;
  handledByName?: string | null;
  reservedByName?: string | null;
  myUserId?: string;
  onOpen: (submission: Submission) => void;
  onSkip: (id: string) => void;
  onDelete: (submission: Submission) => void;
  onReserve: (id: string) => void;
  onUnreserve: (id: string) => void;
  interactive: boolean;
}

export function SubmissionCard({
  submission,
  handledByName,
  reservedByName,
  myUserId,
  onOpen,
  onSkip,
  onDelete,
  onReserve,
  onUnreserve,
  interactive,
}: SubmissionCardProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.storage
      .from('submissions')
      .createSignedUrl(submission.image_path, 3600)
      .then(({ data }) => {
        if (!cancelled && data) setSignedUrl(data.signedUrl);
      });
    return () => { cancelled = true; };
  }, [submission.image_path]);

  // Zamknij dropdown przy kliknięciu na zewnątrz
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const isReserved = submission.status === 'reserved';
  const isMyReservation = isReserved && submission.reserved_by === myUserId;

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-200 ${
        isReserved && !isMyReservation ? 'opacity-80' : ''
      } ${interactive && !isReserved ? 'cursor-pointer hover:shadow-chunky-sm' : ''}`}
      onClick={() => interactive && !isReserved && onOpen(submission)}
    >
      {/* Pasek rezerwacji */}
      {isReserved && (
        <div className="flex items-center gap-1.5 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
          <Lock size={12} />
          {reservedByName && dictionary.adminQueue.reservedBy(reservedByName)}
        </div>
      )}

      <div className="flex flex-col gap-3 p-4">
        <div className="w-full overflow-hidden border-2 border-bg-ink/5 bg-bg-ink/5">
          {signedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signedUrl} alt="" className="w-full object-contain" />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-bg-ink/10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-bg-ink border-t-transparent" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1.5 font-semibold text-bg-ink">
            <User size={14} className="shrink-0 text-bg-ink/50" />
            {submission.sender_nickname}
          </span>
          <span className="shrink-0 text-bg-ink/40">{formatRelativeTime(submission.created_at)}</span>
        </div>

        {submission.channel_link && (
          <a
            href={submission.channel_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 truncate text-sm text-accent hover:underline"
          >
            <Link2 size={14} className="shrink-0" />
            <span className="truncate">{submission.channel_link}</span>
          </a>
        )}

        {/* Akcje */}
        <div className="flex items-center gap-2 pt-1">
          {isMyReservation ? (
            <button
              onClick={(e) => { e.stopPropagation(); onUnreserve(submission.id); }}
              className="touch-target flex flex-1 items-center justify-center gap-1.5 border-2 border-bg-ink bg-white px-3 py-2 text-sm font-semibold text-bg-ink hover:bg-black/5"
            >
              {dictionary.adminQueue.unreserveCta}
            </button>
          ) : !isReserved && (
            <button
              onClick={(e) => { e.stopPropagation(); onReserve(submission.id); }}
              className="touch-target flex flex-1 items-center justify-center gap-1.5 border-2 border-bg-ink bg-accent-soft px-3 py-2 text-sm font-semibold text-accent hover:bg-accent-soft/70"
            >
              <Lock size={14} />
              {dictionary.adminQueue.reserveCta}
            </button>
          )}

          {/* Dropdown trzy kropki */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setDropdownOpen((v) => !v); }}
              className="touch-target flex items-center justify-center border-2 border-bg-ink bg-white px-2 text-bg-ink hover:bg-black/5"
            >
              <MoreHorizontal size={18} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 bottom-full z-20 mb-1 w-40 border-2 border-bg-ink bg-white p-1 shadow-chunky" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { onSkip(submission.id); setDropdownOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-bg-ink hover:bg-accent-soft"
                >
                  <SkipForward size={14} />
                  {dictionary.adminQueue.skipCta}
                </button>
                <button
                  onClick={() => { onDelete(submission); setDropdownOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-danger-fg hover:bg-danger-bg"
                >
                  <Trash2 size={14} />
                  {dictionary.adminQueue.deleteCta}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

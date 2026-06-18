// components/admin/SubmissionCard.tsx
'use client';

import { useEffect, useState } from 'react';
import { User, Link2, Check, Calendar, Trash2, SkipForward } from 'lucide-react';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeTime, formatDateTime } from '@/lib/format-time';
import type { Submission } from '@/lib/database.types';
import { Card } from '@/components/ui/Card';

interface SubmissionCardProps {
  submission: Submission;
  handledByName?: string | null;
  onOpen: (submission: Submission) => void;
  onSkip: (id: string) => void;
  onDelete: (submission: Submission) => void;
  interactive: boolean; // false dla scheduled/done w widoku kolejki
}

export function SubmissionCard({
  submission,
  handledByName,
  onOpen,
  onSkip,
  onDelete,
  interactive,
}: SubmissionCardProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.storage
      .from('submissions')
      .createSignedUrl(submission.image_path, 3600)
      .then(({ data }) => {
        if (!cancelled && data) setSignedUrl(data.signedUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [submission.image_path]);

  const isOverlayed = submission.status !== 'pending';

  return (
    <Card
      className={`relative overflow-hidden transition-opacity ${
        isOverlayed ? 'opacity-75' : ''
      } ${interactive ? 'cursor-pointer hover:shadow-chunky-sm' : ''}`}
      onClick={() => interactive && !isOverlayed && onOpen(submission)}
    >
      {isOverlayed && (
        <div
          className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 ${
            submission.status === 'done' ? 'bg-bubble/90' : 'bg-scheduled/90'
          }`}
        >
          {submission.status === 'done' ? (
            <>
              <Check size={28} className="text-whatsapp" />
              <span className="font-display font-semibold text-bg-ink">
                {dictionary.adminQueue.statusDoneLabel}
              </span>
              {handledByName && (
                <span className="text-sm text-bg-ink/70">
                  {dictionary.adminQueue.statusDoneBy(handledByName)}
                </span>
              )}
            </>
          ) : (
            <>
              <Calendar size={28} className="text-bg-ink/70" />
              <span className="font-display font-semibold text-bg-ink">
                {dictionary.adminQueue.statusScheduledLabel}
              </span>
              {submission.scheduled_for && (
                <span className="text-sm text-bg-ink/70">
                  {formatDateTime(submission.scheduled_for)}
                </span>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 p-4">
        <div className="aspect-video w-full overflow-hidden rounded-card bg-bg-ink/5">
          {signedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={signedUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full animate-pulse bg-bg-ink/10" />
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

        {!isOverlayed && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(submission);
              }}
              className="touch-target flex flex-1 items-center justify-center gap-1.5 rounded-pill border-2 border-danger-border bg-danger-bg px-3 py-2 text-sm font-semibold text-danger-fg hover:bg-danger-border/30"
            >
              <Trash2 size={15} />
              {dictionary.adminQueue.deleteCta}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSkip(submission.id);
              }}
              className="touch-target flex flex-1 items-center justify-center gap-1.5 rounded-pill border-2 border-bg-ink bg-white px-3 py-2 text-sm font-semibold text-bg-ink hover:bg-black/5"
            >
              <SkipForward size={15} />
              {dictionary.adminQueue.skipCta}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

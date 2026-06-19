// components/admin/SubmissionListRow.tsx
'use client';

import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/format-time';
import { applyVariables, buildFinalMessage } from '@/lib/whatsapp-format';
import type { Submission } from '@/lib/database.types';
import { Card } from '@/components/ui/Card';

interface SubmissionListRowProps {
  submission: Submission;
  handledByName?: string | null;
  onOpen: (submission: Submission) => void;
  showCopyButton: boolean;
  onCopied?: () => void;
}

function previewSnippet(rawComment: string, submission: Submission): string {
  const substituted = applyVariables(rawComment, {
    sender: submission.sender_nickname,
    channelLink: submission.channel_link ?? undefined,
  });
  const firstLine = substituted.split('\n')[0] ?? '';
  const trimmed = firstLine.slice(0, 60);
  return trimmed.length < firstLine.length ? `${trimmed}...` : trimmed;
}

export function SubmissionListRow({
  submission,
  handledByName,
  onOpen,
  showCopyButton,
  onCopied,
}: SubmissionListRowProps) {
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

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    let signature = '';
    if (session) {
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('signature')
        .eq('id', session.user.id)
        .single<{ signature: string }>();
      signature = profile?.signature ?? '';
    }

    const finalMessage = buildFinalMessage(submission.comment_body, {
      sender: submission.sender_nickname,
      channelLink: submission.channel_link ?? undefined,
      signature,
    });
    await navigator.clipboard.writeText(finalMessage);

    // Kopiujący "obsługuje" zgłoszenie teraz - podpis pochodzi od osoby
    // wykonującej akcję kopiowania, nie od autora treści (sekcja 5.4).
    await supabase
      .from('submissions')
      .update({ status: 'done', handled_by: session?.user.id })
      .eq('id', submission.id);

    onCopied?.();
  }

  const snippet = previewSnippet(submission.comment_body, submission);

  return (
    <Card
      className="flex cursor-pointer items-center gap-3 p-3 hover:shadow-chunky-sm"
      onClick={() => onOpen(submission)}
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-card bg-bg-ink/5">
        {signedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signedUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full animate-pulse bg-bg-ink/10" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-bg-ink">{snippet || '—'}</p>
        <p className="truncate text-xs text-bg-ink/50">
          {submission.scheduled_for && `${formatDateTime(submission.scheduled_for)} · `}
          {handledByName && dictionary.adminQueue.statusDoneBy(handledByName)}
        </p>
      </div>

      {showCopyButton && (
        <button
          onClick={handleCopy}
          className="touch-target flex shrink-0 items-center gap-1.5 rounded-pill border-2 border-bg-ink bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent hover:bg-accent-soft/70"
        >
          <Copy size={14} />
          {dictionary.editor.copyCta}
        </button>
      )}
    </Card>
  );
}

// components/admin/CommentEditor.tsx
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { buildFinalMessage, renderWhatsAppMarkdownToHtml } from '@/lib/whatsapp-format';
import { wrapSelection, prefixLines } from '@/lib/textarea-formatting';
import type { Submission } from '@/lib/database.types';
import { Button } from '@/components/ui/Button';
import { EditorToolbar } from '@/components/admin/EditorToolbar';
import { SchedulePicker } from '@/components/admin/SchedulePicker';
import { Toast } from '@/components/ui/Toast';

interface CommentEditorProps {
  submission: Submission;
  signature: string;
  onClose: () => void;
  onSaved: () => void;
  readOnly?: boolean;
}

export function CommentEditor({ submission, signature, onClose, onSaved, readOnly = false }: CommentEditorProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState(submission.comment_body || '');
  const [schedulePickerOpen, setSchedulePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [showScheduledToast, setShowScheduledToast] = useState(false);

  const hasChannelLink = Boolean(submission.channel_link);
  const usesChannelVariable = body.includes('%channel_link%');
  const showMissingChannelWarning = usesChannelVariable && !hasChannelLink;

  const finalMessage = buildFinalMessage(body, {
    sender: submission.sender_nickname,
    channelLink: submission.channel_link ?? undefined,
    signature,
  });
  const previewHtml = renderWhatsAppMarkdownToHtml(finalMessage);

  function applyTextareaOp(op: { text: string; selectionStart: number; selectionEnd: number }) {
    setBody(op.text);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(op.selectionStart, op.selectionEnd);
    });
  }

  function getSelection() {
    const ta = textareaRef.current;
    return {
      text: body,
      selectionStart: ta?.selectionStart ?? body.length,
      selectionEnd: ta?.selectionEnd ?? body.length,
    };
  }

  function handleWrapFormat(marker: string) {
    applyTextareaOp(wrapSelection(getSelection(), marker));
  }

  function handleMonospaceBlock() {
    applyTextareaOp(wrapSelection(getSelection(), '```'));
  }

  function handleLinePrefix(kind: 'bullet' | 'numbered' | 'quote') {
    const builder =
      kind === 'bullet' ? () => '- ' : kind === 'quote' ? () => '> ' : (i: number) => `${i + 1}. `;
    applyTextareaOp(prefixLines(getSelection(), builder));
  }

  function handleInsertVariable(variable: string) {
    const sel = getSelection();
    const newText = sel.text.slice(0, sel.selectionStart) + variable + sel.text.slice(sel.selectionEnd);
    const cursor = sel.selectionStart + variable.length;
    applyTextareaOp({ text: newText, selectionStart: cursor, selectionEnd: cursor });
  }

  async function handleSchedule(date: Date) {
    setIsSaving(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase
      .from('submissions')
      .update({
        comment_body: body,
        status: 'scheduled',
        scheduled_for: date.toISOString(),
        handled_by: session?.user.id,
      })
      .eq('id', submission.id);

    setIsSaving(false);
    setSchedulePickerOpen(false);

    if (!error) {
      setShowScheduledToast(true);
      onSaved();
      router.refresh();
    }
  }

  async function handleCopyToWhatsApp() {
    setIsSaving(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    await navigator.clipboard.writeText(finalMessage);

    const { error } = await supabase
      .from('submissions')
      .update({
        comment_body: body,
        status: 'done',
        handled_by: session?.user.id,
      })
      .eq('id', submission.id);

    setIsSaving(false);

    if (!error) {
      setShowCopiedToast(true);
      onSaved();
      router.refresh();
      setTimeout(onClose, 900);
    }
  }

  const isEmpty = body.trim().length === 0;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex h-full w-full max-w-2xl flex-col bg-white sm:h-auto sm:max-h-[90vh] sm:rounded-card-lg sm:border-2 sm:border-bg-ink sm:shadow-chunky">
        <div className="flex items-center justify-between border-b-2 border-bg-ink/10 px-4 py-3">
          <h2 className="font-display text-lg font-bold text-bg-ink">{dictionary.editor.title}</h2>
          <button
            onClick={onClose}
            className="touch-target flex items-center justify-center rounded-full text-bg-ink/60 hover:bg-black/5"
            aria-label={dictionary.editor.closeCta}
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mb-3 flex flex-wrap gap-3 text-sm text-bg-ink/60">
            <span>
              {dictionary.editor.senderLabel}: <strong className="text-bg-ink">{submission.sender_nickname}</strong>
            </span>
            <span>
              {dictionary.editor.channelLinkLabel}:{' '}
              {submission.channel_link ? (
                <a href={submission.channel_link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  {submission.channel_link}
                </a>
              ) : (
                dictionary.editor.noChannelLink
              )}
            </span>
          </div>

          {!readOnly && (
            <EditorToolbar
              onWrapFormat={handleWrapFormat}
              onMonospaceBlock={handleMonospaceBlock}
              onLinePrefix={handleLinePrefix}
              onInsertVariable={handleInsertVariable}
              hasChannelLink={hasChannelLink}
            />
          )}

          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={dictionary.editor.textareaPlaceholder}
            rows={6}
            readOnly={readOnly}
            disabled={readOnly}
            className="w-full resize-none rounded-card border-2 border-bg-ink/20 p-3 font-mono text-sm outline-none focus:border-accent disabled:opacity-60"
          />

          {showMissingChannelWarning && (
            <p className="mt-2 flex items-center gap-1.5 rounded-card border-2 border-scheduled-border bg-scheduled px-3 py-1.5 text-sm text-bg-ink/70">
              <AlertTriangle size={14} className="shrink-0 text-bg-ink/60" />
              {dictionary.editor.missingChannelWarning}
            </p>
          )}

          <div className="mt-4">
            <p className="mb-1.5 text-sm font-semibold text-bg-ink/70">{dictionary.editor.previewLabel}</p>
            <div
              className="wa-preview rounded-card-lg rounded-bl-md border-2 border-bubble-border bg-bubble p-4 text-sm text-bg-ink"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
            <p className="mt-1.5 text-xs text-bg-ink/50">
              {dictionary.editor.previewSignatureHint}{' '}
              <Link href="/admin/settings" className="text-accent hover:underline">
                {dictionary.editor.settingsLinkCta}
              </Link>
            </p>
          </div>
        </div>

        {!readOnly && (
          <div className="flex flex-col gap-2 border-t-2 border-bg-ink/10 p-4 sm:flex-row">
            <Button
              variant="secondary"
              className="flex-1"
              disabled={isEmpty || isSaving}
              onClick={() => setSchedulePickerOpen(true)}
            >
              {dictionary.editor.scheduleCta}
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              disabled={isEmpty}
              isLoading={isSaving}
              onClick={handleCopyToWhatsApp}
            >
              {dictionary.editor.copyCta}
            </Button>
          </div>
        )}
      </div>

      <SchedulePicker
        open={schedulePickerOpen}
        onConfirm={handleSchedule}
        onCancel={() => setSchedulePickerOpen(false)}
        isSaving={isSaving}
      />

      <Toast message={dictionary.editor.copiedToast} show={showCopiedToast} onHide={() => setShowCopiedToast(false)} />
      <Toast
        message={dictionary.editor.scheduleSavedToast}
        show={showScheduledToast}
        onHide={() => setShowScheduledToast(false)}
      />
    </div>
  );
}

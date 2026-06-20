// components/admin/CommentEditor.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, AlertTriangle, Maximize2, Minimize2, Save } from 'lucide-react';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { asUntyped } from '@/lib/supabase/untyped';
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

export function CommentEditor({ submission, signature: initialSignature, onClose, onSaved, readOnly = false }: CommentEditorProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState(submission.comment_body || '');
  const [signature, setSignature] = useState(initialSignature);
  const [schedulePickerOpen, setSchedulePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [showScheduledToast, setShowScheduledToast] = useState(false);
  const [showSignatureSavedToast, setShowSignatureSavedToast] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hasChannelLink = Boolean(submission.channel_link);
  const usesChannelVariable = body.includes('%channel_link%');
  const showMissingChannelWarning = usesChannelVariable && !hasChannelLink;

  const finalMessage = buildFinalMessage(body, {
    sender: submission.sender_nickname,
    channelLink: submission.channel_link ?? undefined,
    signature,
  });
  const previewHtml = renderWhatsAppMarkdownToHtml(finalMessage);

  // Pobierz signed URL dla obrazu zgłoszenia
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.storage
      .from('submissions')
      .createSignedUrl(submission.image_path, 3600)
      .then(({ data }) => {
        if (!cancelled && data) setImageUrl(data.signedUrl);
      });
    return () => { cancelled = true; };
  }, [submission.image_path]);

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

  async function handleSaveSignature() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await asUntyped(supabase)
      .from('admin_profiles')
      .update({ signature })
      .eq('id', session.user.id);

    setShowSignatureSavedToast(true);
    onSaved();
  }

  async function handleSchedule(date: Date) {
    setIsSaving(true);
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await asUntyped(supabase)
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

    try {
      // Kopiuj tekst + obraz jednocześnie przez ClipboardItem
      const items: Record<string, Blob> = {};
      items['text/plain'] = new Blob([finalMessage], { type: 'text/plain' });

      if (imageUrl) {
        try {
          const response = await fetch(imageUrl);
          const imageBlob = await response.blob();
          if (imageBlob.size > 0) {
            const imageType = imageBlob.type || 'image/jpeg';
            items[imageType] = imageBlob;
          }
        } catch {
          // Obraz niedostępny — kopiuj sam tekst
        }
      }

      await navigator.clipboard.write([new ClipboardItem(items)]);
    } catch {
      // Fallback: sam tekst (np. brak wsparcia ClipboardItem)
      await navigator.clipboard.writeText(finalMessage);
    }

    const { error } = await asUntyped(supabase)
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

  // Wrapper — fullscreen vs modal
  const wrapperClass = isFullscreen
    ? 'fixed inset-0 z-50 flex flex-col bg-white'
    : 'fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center';

  const containerClass = isFullscreen
    ? 'flex h-full flex-col bg-white'
    : 'flex h-full w-full flex-col bg-white sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-card-lg sm:border-2 sm:border-bg-ink sm:shadow-chunky';

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b-2 border-bg-ink/10 px-4 py-3">
          <h2 className="font-display text-lg font-bold text-bg-ink">{dictionary.editor.title}</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFullscreen((v) => !v)}
              className="touch-target flex items-center justify-center rounded-full text-bg-ink/60 hover:bg-black/5"
              title={isFullscreen ? dictionary.editor.exitFullscreenCta : dictionary.editor.fullscreenCta}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="touch-target flex items-center justify-center rounded-full text-bg-ink/60 hover:bg-black/5"
              aria-label={dictionary.editor.closeCta}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Meta bar */}
        <div className="shrink-0 border-b-2 border-bg-ink/5 px-4 py-2.5">
          <div className="flex flex-wrap gap-3 text-sm text-bg-ink/60">
            <span>
              {dictionary.editor.senderLabel}: <strong className="text-bg-ink">{submission.sender_nickname}</strong>
            </span>
            {submission.channel_link && (
              <span>
                {dictionary.editor.channelLinkLabel}:{' '}
                <a href={submission.channel_link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  {submission.channel_link}
                </a>
              </span>
            )}
            {!submission.channel_link && (
              <span>
                {dictionary.editor.channelLinkLabel}: <span className="text-bg-ink/40">{dictionary.editor.noChannelLink}</span>
              </span>
            )}
          </div>
        </div>

        {/* Scrollable body — edytor (lewo) + obraz + podgląd (prawo) */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex h-full flex-col gap-4 px-4 py-4 lg:flex-row lg:gap-4">
            {/* Lewa kolumna: toolbar + textarea + podpis */}
            <div className={`flex min-w-0 flex-1 flex-col gap-3 ${isFullscreen ? '' : 'lg:flex-none lg:w-1/2'}`}>
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
                rows={10}
                readOnly={readOnly}
                disabled={readOnly}
                className="w-full resize-none rounded-card border-2 border-bg-ink/20 p-3 font-mono text-sm outline-none focus:border-accent disabled:opacity-60"
              />

              {/* Podpis — edytowalny w edytorze, z opcją zapisu do profilu */}
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-bg-ink">
                  {dictionary.editor.signatureEditLabel}
                  {!readOnly && signature !== initialSignature && (
                    <button
                      onClick={handleSaveSignature}
                      className="ml-auto flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                    >
                      <Save size={12} />
                      {dictionary.editor.saveSignatureCta}
                    </button>
                  )}
                </label>
                <textarea
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder={dictionary.settings.signaturePlaceholder}
                  rows={2}
                  readOnly={readOnly}
                  disabled={readOnly}
                  className="w-full resize-none rounded-card border-2 border-bg-ink/20 p-3 font-mono text-sm outline-none focus:border-accent disabled:opacity-60"
                />
              </div>

              {showMissingChannelWarning && (
                <p className="flex items-center gap-1.5 rounded-card border-2 border-scheduled-border bg-scheduled px-3 py-1.5 text-sm text-bg-ink/70">
                  <AlertTriangle size={14} className="shrink-0 text-bg-ink/60" />
                  {dictionary.editor.missingChannelWarning}
                </p>
              )}
            </div>

            {/* Prawa kolumna: obraz + podgląd WhatsApp */}
            <div className={`flex min-w-0 flex-1 flex-col gap-4 ${isFullscreen ? '' : 'lg:flex-none lg:w-1/2'}`}>
              {/* Obraz zgłoszenia */}
              {imageUrl && (
                <div className="overflow-hidden rounded-card border-2 border-bg-ink/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={dictionary.editor.imageAlt}
                    className="w-full object-contain max-h-48 lg:max-h-56 bg-bg-ink/5"
                  />
                </div>
              )}

              {/* Podgląd WhatsApp — aktualizuje się w czasie rzeczywistym */}
              <div className="flex flex-col">
                <p className="mb-1.5 text-sm font-semibold text-bg-ink/70">{dictionary.editor.previewLabel}</p>
                <div
                  className="wa-preview rounded-card-lg rounded-bl-md border-2 border-bubble-border bg-bubble p-4 text-sm text-bg-ink"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer — akcje */}
        {!readOnly && (
          <div className="flex shrink-0 flex-col gap-2 border-t-2 border-bg-ink/10 p-4 sm:flex-row">
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
      <Toast message={dictionary.editor.scheduleSavedToast} show={showScheduledToast} onHide={() => setShowScheduledToast(false)} />
      <Toast message={dictionary.settings.savedToast} show={showSignatureSavedToast} onHide={() => setShowSignatureSavedToast(false)} />
    </div>
  );
}

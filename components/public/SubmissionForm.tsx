// components/public/SubmissionForm.tsx
'use client';

import { useRef, useState } from 'react';
import { Upload, X, Check, AlertTriangle, ImagePlus } from 'lucide-react';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { isValidImageFile, isValidNickname, isValidUrl } from '@/lib/validation';
import { Button } from '@/components/ui/Button';

type Stage = 'pick-file' | 'details' | 'sending' | 'success' | 'error';

export function SubmissionForm() {
  const [stage, setStage] = useState<Stage>('pick-file');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [nickname, setNickname] = useState('');
  const [channelLink, setChannelLink] = useState('');
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [channelLinkError, setChannelLinkError] = useState<string | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetAll() {
    setStage('pick-file');
    setFile(null);
    setPreviewUrl(null);
    setFileError(null);
    setNickname('');
    setChannelLink('');
    setNicknameError(null);
    setChannelLinkError(null);
  }

  function handleFileSelected(selected: File | null) {
    if (!selected) return;
    const validation = isValidImageFile(selected);
    if (!validation.valid) {
      setFileError(
        validation.reason === 'size' ? dictionary.public.fileTooLarge : dictionary.public.fileWrongType
      );
      return;
    }
    setFileError(null);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setStage('details');
  }

  function handleRemoveFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setStage('pick-file');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function validateDetails(): boolean {
    let valid = true;
    if (!isValidNickname(nickname)) {
      setNicknameError(
        nickname.trim().length === 0 ? dictionary.public.nicknameRequired : dictionary.public.nicknameTooLong
      );
      valid = false;
    } else {
      setNicknameError(null);
    }

    if (!isValidUrl(channelLink)) {
      setChannelLinkError(dictionary.public.channelLinkInvalid);
      valid = false;
    } else {
      setChannelLinkError(null);
    }

    return valid;
  }

  async function handleSubmit() {
    if (!file) return;
    if (!validateDetails()) return;

    setStage('sending');

    try {
      const supabase = createClient();

      const fileExtension = file.name.split('.').pop() || 'jpg';
      const storagePath = `${crypto.randomUUID()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(storagePath, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('submissions').insert({
        image_path: storagePath,
        sender_nickname: nickname.trim(),
        channel_link: channelLink.trim() || null,
      });

      if (insertError) {
        // Upload się powiódł, ale insert nie - traktujemy całość jako błąd.
        throw insertError;
      }

      setStage('success');
      setTimeout(() => {
        resetAll();
      }, 3000);
    } catch {
      setStage('error');
    }
  }

  function handleRetry() {
    setStage('details');
  }

  return (
    <div
      className="relative"
      onDragOver={(e) => {
        e.preventDefault();
        if (stage === 'pick-file') setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (stage === 'pick-file' && e.dataTransfer.files?.[0]) {
          handleFileSelected(e.dataTransfer.files[0]);
        }
      }}
    >
      {stage === 'pick-file' && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`flex w-full flex-col items-center gap-3 rounded-card-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
            isDragging ? 'border-accent bg-accent-soft' : 'border-bg-ink/40 bg-white hover:bg-accent-soft/40'
          }`}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
            <ImagePlus size={28} />
          </span>
          <span className="font-display text-lg font-semibold text-bg-ink">
            {dictionary.public.step1Cta}
          </span>
          <span className="text-sm text-bg-ink/60">{dictionary.public.step1Hint}</span>
          <span className="text-xs text-bg-ink/40">{dictionary.public.dragHint}</span>
          {fileError && (
            <span className="flex items-center gap-1 text-sm font-medium text-danger-fg">
              <AlertTriangle size={14} /> {fileError}
            </span>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/heic,image/webp"
        className="hidden"
        onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
      />

      {(stage === 'details' || stage === 'sending') && file && previewUrl && (
        <div className="flex flex-col gap-4 rounded-card-lg border-2 border-bg-ink bg-white p-5 animate-fade-slide-in">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="h-14 w-14 shrink-0 rounded-card border-2 border-bg-ink object-cover"
            />
            <span className="flex-1 truncate text-sm text-bg-ink/70">{file.name}</span>
            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={stage === 'sending'}
              className="touch-target flex shrink-0 items-center justify-center rounded-full text-bg-ink/50 hover:bg-black/5 hover:text-bg-ink disabled:opacity-40"
              aria-label={dictionary.public.removeFileCta}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nickname" className="text-sm font-semibold text-bg-ink">
              {dictionary.public.nicknameLabel} *
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              maxLength={50}
              disabled={stage === 'sending'}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={dictionary.public.nicknamePlaceholder}
              className="touch-target rounded-card border-2 border-bg-ink/20 px-4 py-2.5 outline-none focus:border-accent disabled:opacity-50"
            />
            {nicknameError && <span className="text-sm text-danger-fg">{nicknameError}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="channelLink" className="text-sm font-semibold text-bg-ink">
              {dictionary.public.channelLinkLabel}
            </label>
            <input
              id="channelLink"
              type="text"
              value={channelLink}
              disabled={stage === 'sending'}
              onChange={(e) => setChannelLink(e.target.value)}
              placeholder={dictionary.public.channelLinkPlaceholder}
              className="touch-target rounded-card border-2 border-bg-ink/20 px-4 py-2.5 outline-none focus:border-accent disabled:opacity-50"
            />
            {channelLinkError && <span className="text-sm text-danger-fg">{channelLinkError}</span>}
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={nickname.trim().length === 0}
            isLoading={stage === 'sending'}
            onClick={handleSubmit}
          >
            {stage === 'sending' ? dictionary.public.sendingState : dictionary.public.submitCta}
          </Button>
        </div>
      )}

      {stage === 'success' && (
        <div className="flex flex-col items-center gap-2 rounded-card-lg border-2 border-bubble-border bg-bubble px-6 py-10 text-center animate-fade-slide-in">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-whatsapp">
            <Check size={26} />
          </span>
          <span className="font-display text-lg font-semibold text-bg-ink">
            {dictionary.public.successTitle}
          </span>
          <span className="text-sm text-bg-ink/70">{dictionary.public.successBody}</span>
        </div>
      )}

      {stage === 'error' && (
        <div className="flex flex-col items-center gap-3 rounded-card-lg border-2 border-danger-border bg-danger-bg px-6 py-10 text-center animate-fade-slide-in">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-danger-fg">
            <AlertTriangle size={24} />
          </span>
          <span className="font-display text-lg font-semibold text-danger-fg">
            {dictionary.public.errorTitle}
          </span>
          <span className="text-sm text-danger-fg/80">{dictionary.public.errorBody}</span>
          <Button variant="secondary" onClick={handleRetry}>
            {dictionary.public.retryCta}
          </Button>
        </div>
      )}
    </div>
  );
}

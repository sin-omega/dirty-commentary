// components/admin/SettingsForm.tsx
'use client';

import { useState } from 'react';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { buildFinalMessage, renderWhatsAppMarkdownToHtml } from '@/lib/whatsapp-format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Toast } from '@/components/ui/Toast';

interface SettingsFormProps {
  username: string;
  displayName: string;
  initialSignature: string;
  userId: string;
}

export function SettingsForm({ username, displayName, initialSignature, userId }: SettingsFormProps) {
  const [signature, setSignature] = useState(initialSignature);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('admin_profiles')
      .update({ signature })
      .eq('id', userId);

    setIsSaving(false);

    if (updateError) {
      setError(dictionary.settings.errorToast);
      return;
    }
    setShowSavedToast(true);
  }

  const previewHtml = renderWhatsAppMarkdownToHtml(
    buildFinalMessage(dictionary.settings.previewSamplePlaceholder, {
      sender: dictionary.settings.previewSampleSender,
      signature,
    })
  );

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-bg-ink">
          {dictionary.settings.accountSection}
        </h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-bg-ink/60">{dictionary.settings.loginLabel}</dt>
            <dd className="font-medium text-bg-ink">{username}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-bg-ink/60">{dictionary.settings.displayNameLabel}</dt>
            <dd className="font-medium text-bg-ink">{displayName}</dd>
          </div>
        </dl>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-bg-ink">
          {dictionary.settings.signatureSection}
        </h2>

        <label htmlFor="signature" className="mb-1.5 block text-sm font-semibold text-bg-ink">
          {dictionary.settings.signatureLabel}
        </label>
        <textarea
          id="signature"
          rows={3}
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder={dictionary.settings.signaturePlaceholder}
          className="w-full resize-none rounded-card border-2 border-bg-ink/20 p-3 font-mono text-sm outline-none focus:border-accent"
        />
        <p className="mt-1.5 text-xs text-bg-ink/50">{dictionary.settings.signatureHint}</p>

        <div className="mt-4">
          <p className="mb-1.5 text-sm font-semibold text-bg-ink/70">{dictionary.settings.previewLabel}</p>
          <div
            className="wa-preview rounded-card-lg rounded-bl-md border-2 border-bubble-border bg-bubble p-4 text-sm text-bg-ink"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>

        {error && <p className="mt-3 text-sm text-danger-fg">{error}</p>}

        <Button variant="primary" className="mt-4 w-full" isLoading={isSaving} onClick={handleSave}>
          {isSaving ? dictionary.settings.savingState : dictionary.settings.saveCta}
        </Button>
      </Card>

      <Toast message={dictionary.settings.savedToast} show={showSavedToast} onHide={() => setShowSavedToast(false)} />
    </div>
  );
}

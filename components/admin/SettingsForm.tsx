// components/admin/SettingsForm.tsx
'use client';

import { useState } from 'react';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { asUntyped } from '@/lib/supabase/untyped';
import { buildFinalMessage, renderWhatsAppMarkdownToHtml } from '@/lib/whatsapp-format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Toast } from '@/components/ui/Toast';

interface SettingsFormProps {
  username: string;
  displayName: string;
  initialSignature: string;
  initialSenderSuffix: string;
  userId: string;
}

export function SettingsForm({ username, displayName, initialSignature, initialSenderSuffix, userId }: SettingsFormProps) {
  const [signature, setSignature] = useState(initialSignature);
  const [senderSuffix, setSenderSuffix] = useState(initialSenderSuffix);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await asUntyped(supabase)
      .from('admin_profiles')
      .update({ signature, sender_suffix: senderSuffix })
      .eq('id', userId);

    setIsSaving(false);

    if (updateError) {
      setError(dictionary.settings.errorToast);
      return;
    }
    setShowSavedToast(true);
  }

  const previewBody = `treść komentarza...\n\n${senderSuffix.replace('%sender%', dictionary.settings.previewSampleSender)}`;
  const previewHtml = renderWhatsAppMarkdownToHtml(
    buildFinalMessage(previewBody, {
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
          className="w-full resize-none border-2 border-bg-ink/20 p-3 font-mono text-sm outline-none focus:border-accent"
        />
        <p className="mt-1.5 text-xs text-bg-ink/50">{dictionary.settings.signatureHint}</p>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-bg-ink">
          {dictionary.settings.senderSuffixSection}
        </h2>

        <label htmlFor="senderSuffix" className="mb-1.5 block text-sm font-semibold text-bg-ink">
          {dictionary.settings.senderSuffixLabel}
        </label>
        <input
          id="senderSuffix"
          type="text"
          value={senderSuffix}
          onChange={(e) => setSenderSuffix(e.target.value)}
          placeholder={dictionary.settings.senderSuffixPlaceholder}
          className="w-full border-2 border-bg-ink/20 px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
        <p className="mt-1.5 text-xs text-bg-ink/50">{dictionary.settings.senderSuffixHint}</p>
      </Card>

      <Card className="p-6">
        <p className="mb-1.5 text-sm font-semibold text-bg-ink/70">{dictionary.settings.previewLabel}</p>
        <div
          className="wa-preview border-2 border-bubble-border bg-bubble p-4 text-sm text-bg-ink"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      </Card>

      {error && <p className="text-sm text-danger-fg">{error}</p>}

      <Button variant="primary" className="w-full" isLoading={isSaving} onClick={handleSave}>
        {isSaving ? dictionary.settings.savingState : dictionary.settings.saveCta}
      </Button>

      <Toast message={dictionary.settings.savedToast} show={showSavedToast} onHide={() => setShowSavedToast(false)} />
    </div>
  );
}

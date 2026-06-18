// components/admin/MasterPanel.tsx
'use client';

import { useState } from 'react';
import { Plus, Copy, ShieldCheck } from 'lucide-react';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { formatDateTime } from '@/lib/format-time';
import type { AdminProfile, InviteToken } from '@/lib/database.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Toast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface MasterPanelProps {
  initialInviteTokens: InviteToken[];
  initialAdmins: AdminProfile[];
}

export function MasterPanel({ initialInviteTokens, initialAdmins }: MasterPanelProps) {
  const [inviteTokens, setInviteTokens] = useState(initialInviteTokens);
  const [admins, setAdmins] = useState(initialAdmins);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminProfile | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    const res = await fetch('/api/invite/create', { method: 'POST' });
    const data: { success: boolean; inviteToken?: InviteToken } = await res.json();
    setIsGenerating(false);

    if (data.success && data.inviteToken) {
      setInviteTokens((prev) => [data.inviteToken!, ...prev]);
    }
  }

  function buildActivationUrl(token: string): string {
    const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    return `${base}/admin/activate/${token}`;
  }

  async function handleCopyLink(token: string) {
    await navigator.clipboard.writeText(buildActivationUrl(token));
    setShowCopiedToast(true);
  }

  async function handleDeactivateConfirmed() {
    if (!deactivateTarget) return;
    setIsDeactivating(true);
    const supabase = createClient();

    // "Dezaktywacja" w tym MVP: usuwamy wiersz admin_profiles (RLS policy
    // "operator deletes admin profiles" pozwala na to operatorowi). Konto w
    // auth.users zostaje, ale bez profilu nie przejdzie dalej w aplikacji.
    await supabase.from('admin_profiles').delete().eq('id', deactivateTarget.id);

    setIsDeactivating(false);
    setAdmins((prev) => prev.filter((a) => a.id !== deactivateTarget.id));
    setDeactivateTarget(null);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-bg-ink">
            {dictionary.master.invitesSection}
          </h2>
          <Button variant="primary" size="sm" isLoading={isGenerating} onClick={handleGenerate}>
            <Plus size={16} />
            {isGenerating ? dictionary.master.generatingState : dictionary.master.generateCta}
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {inviteTokens.map((invite) => {
            const isUsed = Boolean(invite.used_at);
            const isExpired = !isUsed && new Date(invite.expires_at) < new Date();
            return (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-3 rounded-card border-2 border-bg-ink/10 px-3 py-2.5"
              >
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-medium ${
                      isUsed ? 'text-bg-ink/40' : isExpired ? 'text-danger-fg' : 'text-bg-ink'
                    }`}
                  >
                    {isUsed
                      ? dictionary.master.usedLabel
                      : isExpired
                        ? dictionary.activate.expiredTokenTitle
                        : dictionary.master.unusedLabel}
                  </span>
                  <span className="text-xs text-bg-ink/50">
                    {dictionary.master.expiresLabel(formatDateTime(invite.expires_at))}
                  </span>
                </div>
                {!isUsed && !isExpired && (
                  <button
                    onClick={() => handleCopyLink(invite.token)}
                    className="touch-target flex shrink-0 items-center gap-1.5 rounded-pill border-2 border-bg-ink bg-white px-3 py-1.5 text-sm font-semibold text-bg-ink hover:bg-accent-soft"
                  >
                    <Copy size={14} />
                    {dictionary.master.copyLinkCta}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-bg-ink">
          {dictionary.master.adminsSection}
        </h2>

        {admins.length === 0 ? (
          <p className="text-sm text-bg-ink/60">{dictionary.master.adminsEmpty}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between gap-3 rounded-card border-2 border-bg-ink/10 px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-bg-ink">{admin.display_name}</span>
                  <span className="text-sm text-bg-ink/50">@{admin.username}</span>
                  {admin.is_operator && (
                    <span className="flex items-center gap-1 rounded-pill bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                      <ShieldCheck size={12} />
                      {dictionary.master.operatorBadge}
                    </span>
                  )}
                </div>
                {!admin.is_operator && (
                  <button
                    onClick={() => setDeactivateTarget(admin)}
                    className="touch-target shrink-0 rounded-pill border-2 border-danger-border bg-danger-bg px-3 py-1.5 text-sm font-semibold text-danger-fg hover:bg-danger-border/30"
                  >
                    {dictionary.master.deactivateCta}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        title={dictionary.master.deactivateConfirmTitle}
        body={dictionary.master.deactivateConfirmBody}
        confirmLabel={dictionary.master.deactivateConfirmCta}
        cancelLabel={dictionary.master.deactivateCancelCta}
        onConfirm={handleDeactivateConfirmed}
        onCancel={() => setDeactivateTarget(null)}
        isLoading={isDeactivating}
      />

      <Toast message={dictionary.master.linkCopiedToast} show={showCopiedToast} onHide={() => setShowCopiedToast(false)} />
    </div>
  );
}

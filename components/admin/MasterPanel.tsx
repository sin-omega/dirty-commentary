// components/admin/MasterPanel.tsx
'use client';

import { useState } from 'react';
import { Plus, Copy, ShieldCheck, Trash2 } from 'lucide-react';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { asUntyped } from '@/lib/supabase/untyped';
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
  const [deleteTokenTarget, setDeleteTokenTarget] = useState<InviteToken | null>(null);
  const [isDeletingToken, setIsDeletingToken] = useState(false);
  const [showTokenDeletedToast, setShowTokenDeletedToast] = useState(false);

  // Bulk select
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [selectedAdmins, setSelectedAdmins] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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
    await supabase.from('admin_profiles').delete().eq('id', deactivateTarget.id);
    setIsDeactivating(false);
    setAdmins((prev) => prev.filter((a) => a.id !== deactivateTarget.id));
    setDeactivateTarget(null);
  }

  async function handleDeleteTokenConfirmed() {
    if (!deleteTokenTarget) return;
    setIsDeletingToken(true);
    const supabase = createClient();
    await asUntyped(supabase).from('invite_tokens').delete().eq('id', deleteTokenTarget.id);
    setIsDeletingToken(false);
    setInviteTokens((prev) => prev.filter((t) => t.id !== deleteTokenTarget.id));
    setDeleteTokenTarget(null);
    setShowTokenDeletedToast(true);
  }

  async function handleBulkDelete() {
    setIsBulkDeleting(true);
    const supabase = createClient();

    if (selectedTokens.size > 0) {
      await asUntyped(supabase)
        .from('invite_tokens')
        .delete()
        .in('id', Array.from(selectedTokens));
      setInviteTokens((prev) => prev.filter((t) => !selectedTokens.has(t.id)));
    }
    if (selectedAdmins.size > 0) {
      await asUntyped(supabase)
        .from('admin_profiles')
        .delete()
        .in('id', Array.from(selectedAdmins));
      setAdmins((prev) => prev.filter((a) => !selectedAdmins.has(a.id)));
    }

    setIsBulkDeleting(false);
    setBulkDeleteOpen(false);
    setBulkMode(false);
    setSelectedTokens(new Set());
    setSelectedAdmins(new Set());
  }

  function toggleSelectToken(id: string) {
    setSelectedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAdmin(id: string) {
    setSelectedAdmins((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const totalSelected = selectedTokens.size + selectedAdmins.size;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Bulk mode bar */}
      {bulkMode && (
        <div className="flex items-center gap-2 animate-fade-slide-in">
          <span className="text-xs text-bg-ink/50">{totalSelected} zaznaczonych</span>
          {totalSelected > 0 && (
            <Button variant="danger" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 size={14} />
              {dictionary.master.deleteConfirmCta}
            </Button>
          )}
          <button onClick={() => { setBulkMode(false); setSelectedTokens(new Set()); setSelectedAdmins(new Set()); }} className="ml-auto text-xs text-bg-ink/50 hover:text-bg-ink">
            {dictionary.common.cancel}
          </button>
        </div>
      )}

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-bg-ink">{dictionary.master.invitesSection}</h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setBulkMode((v) => !v)}>
              {bulkMode ? dictionary.adminQueue.bulkDeselectCta : 'zaznaczaj'}
            </Button>
            <Button variant="primary" size="sm" isLoading={isGenerating} onClick={handleGenerate}>
              <Plus size={16} />
              {isGenerating ? dictionary.master.generatingState : dictionary.master.generateCta}
            </Button>
          </div>
        </div>

        {inviteTokens.length === 0 ? (
          <p className="text-sm text-bg-ink/60">{dictionary.master.adminsEmpty}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {inviteTokens.map((invite) => {
              const isUsed = Boolean(invite.used_at);
              const isExpired = !isUsed && new Date(invite.expires_at) < new Date();
              return (
                <div key={invite.id} className="flex items-center gap-2">
                  {bulkMode && (
                    <input type="checkbox" checked={selectedTokens.has(invite.id)} onChange={() => toggleSelectToken(invite.id)} className="h-4 w-4 shrink-0 accent-[#D4537E]" />
                  )}
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-3 border-2 border-bg-ink/10 px-3 py-2.5">
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${isUsed ? 'text-bg-ink/40' : isExpired ? 'text-danger-fg' : 'text-bg-ink'}`}>
                        {isUsed ? dictionary.master.usedLabel : isExpired ? dictionary.activate.expiredTokenTitle : dictionary.master.unusedLabel}
                      </span>
                      <span className="text-xs text-bg-ink/50">{dictionary.master.expiresLabel(formatDateTime(invite.expires_at))}</span>
                    </div>
                    {!bulkMode && (
                      <div className="flex shrink-0 items-center gap-1.5">
                        {!isUsed && !isExpired && (
                          <button onClick={() => handleCopyLink(invite.token)} className="touch-target flex items-center gap-1.5 border-2 border-bg-ink bg-white px-3 py-1.5 text-sm font-semibold text-bg-ink hover:bg-accent-soft">
                            <Copy size={14} />{dictionary.master.copyLinkCta}
                          </button>
                        )}
                        <button onClick={() => setDeleteTokenTarget(invite)} className="touch-target flex items-center justify-center border-2 border-danger-border bg-danger-bg px-2.5 py-1.5 text-sm font-semibold text-danger-fg hover:bg-danger-border/30" title={dictionary.master.deleteTokenCta}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-bg-ink">{dictionary.master.adminsSection}</h2>
          {bulkMode && (
            <span className="text-xs text-bg-ink/50">{selectedAdmins.size} / {admins.length}</span>
          )}
        </div>

        {admins.length === 0 ? (
          <p className="text-sm text-bg-ink/60">{dictionary.master.adminsEmpty}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center gap-2">
                {bulkMode && (
                  <input type="checkbox" checked={selectedAdmins.has(admin.id)} onChange={() => toggleSelectAdmin(admin.id)} className="h-4 w-4 shrink-0 accent-[#D4537E]" />
                )}
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3 border-2 border-bg-ink/10 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-bg-ink">{admin.display_name}</span>
                    <span className="text-sm text-bg-ink/50">@{admin.username}</span>
                    {admin.is_operator && (
                      <span className="flex items-center gap-1 bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                        <ShieldCheck size={12} />{dictionary.master.operatorBadge}
                      </span>
                    )}
                  </div>
                  {!bulkMode && !admin.is_operator && (
                    <button onClick={() => setDeactivateTarget(admin)} className="touch-target shrink-0 border-2 border-danger-border bg-danger-bg px-3 py-1.5 text-sm font-semibold text-danger-fg hover:bg-danger-border/30">
                      {dictionary.master.deactivateCta}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog open={Boolean(deactivateTarget)} title={dictionary.master.deactivateConfirmTitle} body={dictionary.master.deactivateConfirmBody} confirmLabel={dictionary.master.deactivateConfirmCta} cancelLabel={dictionary.master.deactivateCancelCta} onConfirm={handleDeactivateConfirmed} onCancel={() => setDeactivateTarget(null)} isLoading={isDeactivating} />
      <ConfirmDialog open={Boolean(deleteTokenTarget)} title={dictionary.master.deleteTokenConfirmTitle} body={dictionary.master.deleteTokenConfirmBody} confirmLabel={dictionary.master.deleteTokenConfirmCta} cancelLabel={dictionary.master.deleteTokenCancelCta} onConfirm={handleDeleteTokenConfirmed} onCancel={() => setDeleteTokenTarget(null)} isLoading={isDeletingToken} />
      <ConfirmDialog open={bulkDeleteOpen} title={dictionary.master.deleteConfirmTitle} body={dictionary.master.deleteConfirmBody} confirmLabel={dictionary.master.deleteConfirmCta} cancelLabel={dictionary.master.deleteCancelCta} onConfirm={handleBulkDelete} onCancel={() => setBulkDeleteOpen(false)} isLoading={isBulkDeleting} />

      <Toast message={dictionary.master.linkCopiedToast} show={showCopiedToast} onHide={() => setShowCopiedToast(false)} />
      <Toast message={dictionary.master.tokenDeletedToast} show={showTokenDeletedToast} onHide={() => setShowTokenDeletedToast(false)} />
    </div>
  );
}

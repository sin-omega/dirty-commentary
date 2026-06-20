// components/admin/AdminQueueClient.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { asUntyped } from '@/lib/supabase/untyped';
import type { Submission } from '@/lib/database.types';
import { SubmissionCard } from '@/components/admin/SubmissionCard';
import { SubmissionListRow } from '@/components/admin/SubmissionListRow';
import { CommentEditor } from '@/components/admin/CommentEditor';
import { OverdueBanner } from '@/components/admin/OverdueBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

type Tab = 'pending' | 'scheduled' | 'done';

interface AdminQueueClientProps {
  initialOverdueCount: number;
  initialMyUserId: string;
  initialSenderSuffix: string;
}

export function AdminQueueClient({ initialOverdueCount, initialMyUserId, initialSenderSuffix }: AdminQueueClientProps) {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams.get('tab');
    return t === 'scheduled' ? 'scheduled' : t === 'done' ? 'done' : 'pending';
  });

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [handlerNames, setHandlerNames] = useState<Record<string, string>>({});
  const [handlerSignatures, setHandlerSignatures] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [mySignature, setMySignature] = useState('');
  const [myUserId] = useState(initialMyUserId);

  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Submission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [overdueCount, setOverdueCount] = useState(initialOverdueCount);

  // Bulk select
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data } = await asUntyped(supabase)
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<Submission[]>();

    if (data) setSubmissions(data);

    const { data: profiles } = await asUntyped(supabase)
      .from('admin_profiles')
      .select('id, display_name, signature')
      .returns<{ id: string; display_name: string; signature: string }[]>();
    if (profiles) {
      const names: Record<string, string> = {};
      const sigs: Record<string, string> = {};
      profiles.forEach((p) => { names[p.id] = p.display_name; sigs[p.id] = p.signature; });
      setHandlerNames(names);
      setHandlerSignatures(sigs);
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: myProfile } = await supabase
        .from('admin_profiles')
        .select('signature')
        .eq('id', session.user.id)
        .single<{ signature: string }>();
      setMySignature(myProfile?.signature ?? '');
    }

    const { count } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString());
    setOverdueCount(count ?? 0);

    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const t = searchParams.get('tab');
    setActiveTab(t === 'scheduled' ? 'scheduled' : t === 'done' ? 'done' : 'pending');
  }, [searchParams]);

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setBulkMode(false);
    setSelectedIds(new Set());
    const url = tab === 'pending' ? '/admin' : `/admin?tab=${tab}`;
    window.history.replaceState(null, '', url);
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const supabase = createClient();
    await supabase.storage.from('submissions').remove([deleteTarget.image_path]);
    await supabase.from('submissions').delete().eq('id', deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);
    loadData();
  }

  async function handleBulkDelete() {
    setIsBulkDeleting(true);
    const supabase = createClient();
    const ids = Array.from(selectedIds);

    // Pobierz ścieżki obrazów do usunięcia
    const { data } = await asUntyped(supabase)
      .from('submissions')
      .select('image_path')
      .in('id', ids);
    if (data) {
      const paths = (data as { image_path: string }[]).map((d) => d.image_path);
      await supabase.storage.from('submissions').remove(paths);
    }

    await asUntyped(supabase)
      .from('submissions')
      .delete()
      .in('id', ids);

    setIsBulkDeleting(false);
    setBulkDeleteOpen(false);
    setBulkMode(false);
    setSelectedIds(new Set());
    loadData();
  }

  function handleSkip(id: string) {
    setSkippedIds((prev) => new Set(prev).add(id));
  }

  async function handleReserve(id: string) {
    const supabase = createClient();
    await asUntyped(supabase)
      .from('submissions')
      .update({ status: 'reserved', reserved_by: myUserId })
      .eq('id', id);
    loadData();
  }

  async function handleUnreserve(id: string) {
    const supabase = createClient();
    await asUntyped(supabase)
      .from('submissions')
      .update({ status: 'pending', reserved_by: null })
      .eq('id', id);
    loadData();
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const ids = visibleSubmissions.map((s) => s.id);
    setSelectedIds((prev) => {
      if (ids.every((id) => prev.has(id))) return new Set();
      return new Set(ids);
    });
  }

  const pendingCount = submissions.filter((s) => s.status === 'pending' || s.status === 'reserved').length;
  const reservedNames = { ...handlerNames };

  let visibleSubmissions: Submission[];
  if (activeTab === 'pending') {
    // Tylko pending + reserved (NIE scheduled/done)
    visibleSubmissions = submissions.filter(
      (s) => (s.status === 'pending' || s.status === 'reserved') && !skippedIds.has(s.id)
    );
  } else if (activeTab === 'scheduled') {
    visibleSubmissions = submissions
      .filter((s) => s.status === 'scheduled')
      .sort((a, b) => (a.scheduled_for ?? '').localeCompare(b.scheduled_for ?? ''));
  } else {
    visibleSubmissions = submissions
      .filter((s) => s.status === 'done')
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }

  const emptyMessage =
    activeTab === 'pending'
      ? dictionary.adminQueue.emptyPending
      : activeTab === 'scheduled'
        ? dictionary.adminQueue.emptyScheduled
        : dictionary.adminQueue.emptyDone;

  return (
    <div className="mx-auto max-w-5xl">
      <OverdueBanner count={overdueCount} onViewClick={() => switchTab('scheduled')} />

      {/* Bulk actions bar */}
      {bulkMode && (
        <div className="mb-3 flex items-center gap-2 animate-fade-slide-in">
          <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
            {selectedIds.size === visibleSubmissions.length && visibleSubmissions.length > 0
              ? dictionary.adminQueue.bulkDeselectCta
              : dictionary.adminQueue.bulkSelectCta}
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="danger" size="sm" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 size={14} />
              {dictionary.adminQueue.bulkDeleteCta} ({selectedIds.size})
            </Button>
          )}
          <button
            onClick={() => { setBulkMode(false); setSelectedIds(new Set()); }}
            className="ml-auto text-xs text-bg-ink/50 hover:text-bg-ink"
          >
            {dictionary.common.cancel}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : visibleSubmissions.length === 0 ? (
        <p className="border-2 border-dashed border-bg-ink/20 bg-white px-6 py-12 text-center text-sm text-bg-ink/60">
          {emptyMessage}
        </p>
      ) : activeTab === 'pending' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSubmissions.map((submission) => (
            <div key={submission.id} className="flex gap-2">
              {bulkMode && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(submission.id)}
                  onChange={() => toggleSelect(submission.id)}
                  className="mt-4 h-5 w-5 shrink-0 accent-[#D4537E]"
                />
              )}
              <div className="min-w-0 flex-1">
                <SubmissionCard
                  submission={submission}
                  handledByName={submission.handled_by ? handlerNames[submission.handled_by] : null}
                  reservedByName={submission.reserved_by ? reservedNames[submission.reserved_by] || null : null}
                  myUserId={myUserId}
                  onOpen={setEditingSubmission}
                  onSkip={handleSkip}
                  onDelete={setDeleteTarget}
                  onReserve={handleReserve}
                  onUnreserve={handleUnreserve}
                  interactive={!bulkMode}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          {visibleSubmissions.map((submission) => (
            <div key={submission.id} className="flex items-center gap-2">
              {bulkMode && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(submission.id)}
                  onChange={() => toggleSelect(submission.id)}
                  className="h-5 w-5 shrink-0 accent-[#D4537E]"
                />
              )}
              <div className="min-w-0 flex-1">
                <SubmissionListRow
                  submission={submission}
                  handledByName={submission.handled_by ? handlerNames[submission.handled_by] : null}
                  handlerSignature={submission.handled_by ? handlerSignatures[submission.handled_by] || null : null}
                  onOpen={setEditingSubmission}
                  showCopyButton={activeTab === 'scheduled'}
                  showDeleteButton={activeTab === 'done'}
                  onDelete={() => setDeleteTarget(submission)}
                  onCopied={loadData}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {editingSubmission && (
        <CommentEditor
          submission={editingSubmission}
          signature={mySignature}
          onClose={() => setEditingSubmission(null)}
          onSaved={loadData}
          readOnly={editingSubmission.status === 'done'}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={dictionary.adminQueue.deleteConfirmTitle}
        body={dictionary.adminQueue.deleteConfirmBody}
        confirmLabel={dictionary.adminQueue.deleteConfirmCta}
        cancelLabel={dictionary.adminQueue.deleteCancelCta}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={dictionary.adminQueue.bulkDeleteConfirmTitle}
        body={dictionary.adminQueue.bulkDeleteConfirmBody(selectedIds.size)}
        confirmLabel={dictionary.adminQueue.deleteConfirmCta}
        cancelLabel={dictionary.adminQueue.deleteCancelCta}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        isLoading={isBulkDeleting}
      />
    </div>
  );
}

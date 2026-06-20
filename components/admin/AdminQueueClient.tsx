// components/admin/AdminQueueClient.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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

type Tab = 'pending' | 'scheduled' | 'done';

interface AdminQueueClientProps {
  initialOverdueCount: number;
}

export function AdminQueueClient({ initialOverdueCount }: AdminQueueClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const t = searchParams.get('tab');
    return t === 'scheduled' ? 'scheduled' : t === 'done' ? 'done' : 'pending';
  });

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [handlerNames, setHandlerNames] = useState<Record<string, string>>({});
  const [handlerSignatures, setHandlerSignatures] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [mySignature, setMySignature] = useState('');

  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Submission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [overdueCount, setOverdueCount] = useState(initialOverdueCount);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data } = await asUntyped(supabase)
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .returns<Submission[]>();

    if (data) setSubmissions(data);

    // Imiona i podpisy adminów — podpisy potrzebne w tabie "omówione"
    const { data: profiles } = await asUntyped(supabase)
      .from('admin_profiles')
      .select('id, display_name, signature')
      .returns<{ id: string; display_name: string; signature: string }[]>();
    if (profiles) {
      const names: Record<string, string> = {};
      const sigs: Record<string, string> = {};
      profiles.forEach((p) => {
        names[p.id] = p.display_name;
        sigs[p.id] = p.signature;
      });
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync tab z URL (gdy użytkownik klika w PanelSwitch)
  useEffect(() => {
    const t = searchParams.get('tab');
    setActiveTab(t === 'scheduled' ? 'scheduled' : t === 'done' ? 'done' : 'pending');
  }, [searchParams]);

  function switchTab(tab: Tab) {
    setActiveTab(tab);
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

  function handleSkip(id: string) {
    setSkippedIds((prev) => new Set(prev).add(id));
  }

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  let visibleSubmissions: Submission[];
  if (activeTab === 'pending') {
    // Pokazuje pending (poza pominiętymi w tej sesji) + scheduled/done jako
    // przygaszone karty (żeby wszyscy admini widzieli co już jest zaklepane).
    visibleSubmissions = submissions.filter(
      (s) => s.status !== 'pending' || !skippedIds.has(s.id)
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

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : visibleSubmissions.length === 0 ? (
        <p className="rounded-card border-2 border-dashed border-bg-ink/20 bg-white px-6 py-12 text-center text-sm text-bg-ink/60">
          {emptyMessage}
        </p>
      ) : activeTab === 'pending' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              handledByName={submission.handled_by ? handlerNames[submission.handled_by] : null}
              onOpen={setEditingSubmission}
              onSkip={handleSkip}
              onDelete={setDeleteTarget}
              interactive
            />
          ))}
        </div>
      ) : (
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          {visibleSubmissions.map((submission) => (
            <SubmissionListRow
              key={submission.id}
              submission={submission}
              handledByName={submission.handled_by ? handlerNames[submission.handled_by] : null}
              handlerSignature={submission.handled_by ? handlerSignatures[submission.handled_by] || null : null}
              onOpen={setEditingSubmission}
              showCopyButton={activeTab === 'scheduled'}
              showDeleteButton={activeTab === 'done'}
              onDelete={() => setDeleteTarget(submission)}
              onCopied={loadData}
            />
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
    </div>
  );
}

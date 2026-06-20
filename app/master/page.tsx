// app/master/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/server';
import { asUntyped } from '@/lib/supabase/untyped';
import type { InviteToken, AdminProfile } from '@/lib/database.types';
import { MasterPanel } from '@/components/admin/MasterPanel';

export default async function MasterPage() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('is_operator')
    .eq('id', session.user.id)
    .single<{ is_operator: boolean }>();

  if (!profile?.is_operator) redirect('/admin');

  const { data: inviteTokens } = await asUntyped(supabase)
    .from('invite_tokens')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<InviteToken[]>();

  const { data: admins } = await asUntyped(supabase)
    .from('admin_profiles')
    .select('*')
    .order('created_at', { ascending: true })
    .returns<AdminProfile[]>();

  return (
    <div>
      <div className="mx-auto mb-5 max-w-2xl">
        <Link href="/admin" className="text-sm text-bg-ink/50 hover:text-bg-ink/80">
          {dictionary.master.backCta}
        </Link>
      </div>
      <h1 className="mb-5 text-center font-display text-2xl font-bold text-bg-ink">
        {dictionary.master.title}
      </h1>
      <MasterPanel initialInviteTokens={inviteTokens ?? []} initialAdmins={admins ?? []} />
    </div>
  );
}

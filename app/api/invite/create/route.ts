// app/api/invite/create/route.ts
//
// Generuje nowy token aktywacyjny. Wywoływane z /master przez zalogowanego
// operatora. Sprawdzamy sesję i is_operator przez klienta server-side
// (anon/authenticated key, respektuje RLS), a token wstawiamy też przez ten
// sam klient - policy "operator manages invite tokens" pozwala na to, bo
// operator jest authenticated i ma is_operator=true.
//
// Kryptograficznie bezpieczny token generowany przez crypto.randomBytes,
// nigdy zgadywalny.

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { asUntyped } from '@/lib/supabase/untyped';
import type { InviteToken } from '@/lib/database.types';

const TOKEN_TTL_HOURS = 48;

export async function POST() {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ success: false, reason: 'unauthenticated' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('admin_profiles')
    .select('id, is_operator')
    .eq('id', session.user.id)
    .single<{ id: string; is_operator: boolean }>();

  if (!profile?.is_operator) {
    return NextResponse.json({ success: false, reason: 'forbidden' }, { status: 403 });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { data: inviteToken, error } = await asUntyped(supabase)
    .from('invite_tokens')
    .insert({
      token,
      created_by: profile.id,
      expires_at: expiresAt,
    })
    .select('*')
    .single<InviteToken>();

  if (error || !inviteToken) {
    return NextResponse.json({ success: false, reason: 'insert-failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true, inviteToken });
}

// app/api/invite/verify/route.ts
//
// Weryfikuje czy token aktywacyjny jest poprawny/aktywny/niewygasły.
// Musi działać server-side z SUPABASE_SERVICE_ROLE_KEY, bo osoba aktywująca
// konto nie jest zalogowana, a 'anon' nie ma żadnych praw do invite_tokens
// (i tak powinno zostać). Zwraca tylko { valid, reason? } - nigdy samego
// tokenu czy innych szczegółów wiersza.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const { token } = await request.json();

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ valid: false, reason: 'invalid' });
  }

  const supabaseAdmin = createAdminClient();

  const { data: inviteToken, error } = await supabaseAdmin
    .from('invite_tokens')
    .select('expires_at, used_at')
    .eq('token', token)
    .single();

  if (error || !inviteToken) {
    return NextResponse.json({ valid: false, reason: 'invalid' });
  }

  if (inviteToken.used_at) {
    return NextResponse.json({ valid: false, reason: 'used' });
  }

  if (new Date(inviteToken.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: 'expired' });
  }

  return NextResponse.json({ valid: true });
}

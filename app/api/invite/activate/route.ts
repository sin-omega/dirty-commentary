// app/api/invite/activate/route.ts
//
// Aktywuje konto: weryfikuje token, sprawdza unikalność username, tworzy
// użytkownika w auth.users (przez service role) i wiersz w admin_profiles,
// oznacza token jako wykorzystany. Wszystko server-side, żeby anon nigdy
// nie potrzebował praw zapisu do invite_tokens / admin_profiles.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { usernameToInternalEmail, isValidUsername, normalizeUsername } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  const body = await request.json();
  const { token, username, displayName, password } = body as {
    token?: string;
    username?: string;
    displayName?: string;
    password?: string;
  };

  if (!token || !username || !displayName || !password) {
    return NextResponse.json({ success: false, reason: 'missing-fields' }, { status: 400 });
  }

  const normalizedUsername = normalizeUsername(username);

  if (!isValidUsername(normalizedUsername)) {
    return NextResponse.json({ success: false, reason: 'invalid-username' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ success: false, reason: 'weak-password' }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  // 1. Re-weryfikuj token (nie ufaj tylko klientowi, mógł minąć czas między
  //    /verify a /activate).
  const { data: inviteToken, error: tokenError } = await supabaseAdmin
    .from('invite_tokens')
    .select('id, expires_at, used_at')
    .eq('token', token)
    .single();

  if (tokenError || !inviteToken) {
    return NextResponse.json({ success: false, reason: 'invalid' }, { status: 400 });
  }
  if (inviteToken.used_at) {
    return NextResponse.json({ success: false, reason: 'used' }, { status: 400 });
  }
  if (new Date(inviteToken.expires_at) < new Date()) {
    return NextResponse.json({ success: false, reason: 'expired' }, { status: 400 });
  }

  // 2. Sprawdź unikalność username.
  const { data: existingProfile } = await supabaseAdmin
    .from('admin_profiles')
    .select('id')
    .eq('username', normalizedUsername)
    .maybeSingle();

  if (existingProfile) {
    return NextResponse.json({ success: false, reason: 'username-taken' }, { status: 409 });
  }

  // 3. Stwórz użytkownika w auth.users.
  const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
    email: usernameToInternalEmail(normalizedUsername),
    password,
    email_confirm: true,
    user_metadata: {
      username: normalizedUsername,
      display_name: displayName,
      is_operator: false,
    },
  });

  if (createUserError || !newUser.user) {
    return NextResponse.json({ success: false, reason: 'create-failed' }, { status: 500 });
  }

  // 4. Stwórz wiersz w admin_profiles explicite (trigger ma "on conflict do
  //    nothing", więc to jest bezpieczne nawet jeśli trigger też próbuje).
  const { error: profileError } = await supabaseAdmin.from('admin_profiles').upsert({
    id: newUser.user.id,
    username: normalizedUsername,
    display_name: displayName,
    signature: '',
    is_operator: false,
  });

  if (profileError) {
    return NextResponse.json({ success: false, reason: 'profile-failed' }, { status: 500 });
  }

  // 5. Oznacz token jako wykorzystany.
  await supabaseAdmin
    .from('invite_tokens')
    .update({ used_at: new Date().toISOString(), created_admin_id: newUser.user.id })
    .eq('id', inviteToken.id);

  return NextResponse.json({ success: true });
}

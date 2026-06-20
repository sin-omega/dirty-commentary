// components/admin/LoginForm.tsx
'use client';

import { useState } from 'react';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { usernameToInternalEmail, normalizeUsername } from '@/lib/auth-helpers';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const email = usernameToInternalEmail(normalizeUsername(username));

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.session || !data.user) {
      setError(dictionary.adminLogin.genericError);
      setIsSubmitting(false);
      return;
    }

    // signInWithPassword zwraca dane sesji w odpowiedzi, ale wewnętrzny stan
    // klienta (token używany przy kolejnych zapytaniach REST/RLS) bywa
    // zsynchronizowany asynchronicznie ułamek sekundy później. Zapytanie
    // o is_operator wykonane od razu potrafiło więc polecieć bez właściwego
    // tokenu auth, RLS odrzucał je jako 'anon', a profile zawsze wracał
    // null -> destination zawsze '/admin'. setSession() ustawia token
    // synchronicznie przed kolejnym zapytaniem.
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

    const { data: profile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('is_operator')
      .eq('id', data.user.id)
      .single<{ is_operator: boolean }>();

    if (profileError) {
      setError(dictionary.adminLogin.genericError);
      setIsSubmitting(false);
      return;
    }

    const destination = profile?.is_operator ? '/master' : '/admin';

    // Pełne przeładowanie (zamiast router.push) - middleware czyta sesję z
    // cookies przy każdym requeście, a świeżo ustawiona sesja z
    // signInWithPassword potrzebuje pełnego nawigacyjnego requestu, żeby
    // cookies zdążyły dotrzeć do przeglądarki. router.push (client-side
    // navigation) potrafił wyprzedzić ten zapis i middleware widział brak
    // sesji, odsyłając z powrotem na /admin/login -> /admin.
    window.location.href = destination;
  }

  return (
    <Card className="w-full max-w-[380px] p-6">
      <h1 className="mb-5 text-center font-display text-2xl font-bold text-bg-ink">
        {dictionary.adminLogin.title}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="text-sm font-semibold text-bg-ink">
            {dictionary.adminLogin.usernameLabel}
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={dictionary.adminLogin.usernamePlaceholder}
            disabled={isSubmitting}
            className="touch-target rounded-card border-2 border-bg-ink/20 px-4 py-2.5 outline-none focus:border-accent disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-semibold text-bg-ink">
            {dictionary.adminLogin.passwordLabel}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={dictionary.adminLogin.passwordPlaceholder}
            disabled={isSubmitting}
            className="touch-target rounded-card border-2 border-bg-ink/20 px-4 py-2.5 outline-none focus:border-accent disabled:opacity-50"
          />
        </div>

        {error && (
          <p className="rounded-card border-2 border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-fg">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
          {isSubmitting ? dictionary.adminLogin.submittingState : dictionary.adminLogin.submitCta}
        </Button>

        <p className="text-center text-xs text-bg-ink/50">{dictionary.adminLogin.noRegisterHint}</p>
      </form>
    </Card>
  );
}

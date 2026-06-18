// components/admin/ActivateForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, AlertTriangle } from 'lucide-react';
import { dictionary } from '@/lib/dictionary';
import { isValidUsername, normalizeUsername } from '@/lib/auth-helpers';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';

type VerifyState = 'checking' | 'valid' | 'invalid' | 'used' | 'expired';

export function ActivateForm({ token }: { token: string }) {
  const router = useRouter();
  const [verifyState, setVerifyState] = useState<VerifyState>('checking');

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/invite/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) setVerifyState('valid');
        else if (data.reason === 'used') setVerifyState('used');
        else if (data.reason === 'expired') setVerifyState('expired');
        else setVerifyState('invalid');
      })
      .catch(() => setVerifyState('invalid'));
  }, [token]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    const normalized = normalizeUsername(username);

    if (!isValidUsername(normalized)) {
      newErrors.username = dictionary.activate.usernameHint;
    }
    if (displayName.trim().length === 0) {
      newErrors.displayName = dictionary.activate.displayNameRequired;
    }
    if (password.length < 8) {
      newErrors.password = dictionary.activate.passwordTooShort;
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = dictionary.activate.passwordsDontMatch;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const res = await fetch('/api/invite/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          username: normalizeUsername(username),
          displayName: displayName.trim(),
          password,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        if (data.reason === 'username-taken') {
          setErrors({ username: dictionary.activate.usernameTaken });
        } else {
          setErrors({ form: dictionary.activate.genericError });
        }
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setErrors({ form: dictionary.activate.genericError });
      setIsSubmitting(false);
    }
  }

  if (verifyState === 'checking') {
    return (
      <Card className="flex w-full max-w-[380px] flex-col items-center gap-3 p-8">
        <Spinner />
      </Card>
    );
  }

  if (verifyState === 'invalid' || verifyState === 'used' || verifyState === 'expired') {
    const titleKey =
      verifyState === 'used'
        ? dictionary.activate.usedTokenTitle
        : verifyState === 'expired'
          ? dictionary.activate.expiredTokenTitle
          : dictionary.activate.invalidTokenTitle;
    const bodyKey =
      verifyState === 'used'
        ? dictionary.activate.usedTokenBody
        : verifyState === 'expired'
          ? dictionary.activate.expiredTokenBody
          : dictionary.activate.invalidTokenBody;

    return (
      <Card className="flex w-full max-w-[380px] flex-col items-center gap-3 p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg text-danger-fg">
          <AlertTriangle size={24} />
        </span>
        <h1 className="font-display text-xl font-bold text-bg-ink">{titleKey}</h1>
        <p className="text-sm text-bg-ink/70">{bodyKey}</p>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="flex w-full max-w-[380px] flex-col items-center gap-3 p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bubble text-whatsapp">
          <Check size={24} />
        </span>
        <h1 className="font-display text-xl font-bold text-bg-ink">
          {dictionary.activate.successTitle}
        </h1>
        <p className="text-sm text-bg-ink/70">{dictionary.activate.successBody}</p>
        <Button variant="primary" onClick={() => router.push('/admin/login')}>
          {dictionary.activate.goToLoginCta}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-[380px] p-6">
      <h1 className="mb-1 text-center font-display text-2xl font-bold text-bg-ink">
        {dictionary.activate.title}
      </h1>
      <p className="mb-5 text-center text-sm text-bg-ink/60">{dictionary.activate.intro}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="username" className="text-sm font-semibold text-bg-ink">
            {dictionary.activate.usernameLabel}
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={dictionary.activate.usernamePlaceholder}
            disabled={isSubmitting}
            className="touch-target rounded-card border-2 border-bg-ink/20 px-4 py-2.5 outline-none focus:border-accent disabled:opacity-50"
          />
          <span className="text-xs text-bg-ink/50">{dictionary.activate.usernameHint}</span>
          {errors.username && <span className="text-sm text-danger-fg">{errors.username}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="displayName" className="text-sm font-semibold text-bg-ink">
            {dictionary.activate.displayNameLabel}
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={dictionary.activate.displayNamePlaceholder}
            disabled={isSubmitting}
            className="touch-target rounded-card border-2 border-bg-ink/20 px-4 py-2.5 outline-none focus:border-accent disabled:opacity-50"
          />
          {errors.displayName && <span className="text-sm text-danger-fg">{errors.displayName}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-semibold text-bg-ink">
            {dictionary.activate.passwordLabel}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={dictionary.activate.passwordPlaceholder}
            disabled={isSubmitting}
            className="touch-target rounded-card border-2 border-bg-ink/20 px-4 py-2.5 outline-none focus:border-accent disabled:opacity-50"
          />
          {errors.password && <span className="text-sm text-danger-fg">{errors.password}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-semibold text-bg-ink">
            {dictionary.activate.confirmPasswordLabel}
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
            className="touch-target rounded-card border-2 border-bg-ink/20 px-4 py-2.5 outline-none focus:border-accent disabled:opacity-50"
          />
          {errors.confirmPassword && (
            <span className="text-sm text-danger-fg">{errors.confirmPassword}</span>
          )}
        </div>

        {errors.form && (
          <p className="rounded-card border-2 border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-fg">
            {errors.form}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isSubmitting}>
          {isSubmitting ? dictionary.activate.submittingState : dictionary.activate.submitCta}
        </Button>
      </form>
    </Card>
  );
}

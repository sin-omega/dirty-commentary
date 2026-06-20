// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, LogIn } from 'lucide-react';
import { dictionary, splitBrandName } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';
import { SubmissionForm } from '@/components/public/SubmissionForm';
import { LoginModal } from '@/components/admin/LoginModal';

export default function HomePage() {
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL;
  const { baseName, accent } = splitBrandName();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(!!data.user);
    });
  }, []);

  function handleLoginClick() {
    if (isLoggedIn) {
      window.location.href = '/admin';
    } else {
      setLoginModalOpen(true);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-page px-4 py-6 sm:py-10">
      <div className="flex w-full max-w-[420px] flex-1 flex-col justify-center gap-5 sm:flex-none">
        <header className="flex flex-col items-center gap-2 text-center">
          <span className="border-2 border-bg-ink bg-white px-3 py-1 text-xs font-medium text-bg-ink/70">
            {dictionary.brand.eyebrow}
          </span>
          <h1 className="font-display text-3xl font-extrabold leading-tight text-bg-ink sm:text-4xl">
            {baseName}
            <span className="text-accent">{accent}</span>
          </h1>
          <p className="text-sm text-bg-ink/70">{dictionary.public.subtitle}</p>
        </header>

        <SubmissionForm />

        <footer className="flex flex-col items-center gap-3 pt-1">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target inline-flex w-full items-center justify-center gap-2 border-2 border-bg-ink bg-whatsapp px-5 py-3 font-display font-semibold text-whatsapp-fg shadow-chunky transition-colors hover:bg-whatsapp/90"
            >
              <MessageCircle size={20} />
              {dictionary.public.whatsappCta}
            </a>
          ) : null}

          <button
            onClick={handleLoginClick}
            className="inline-flex items-center gap-1.5 text-xs text-bg-ink/50 hover:text-bg-ink/80"
          >
            <LogIn size={13} />
            {dictionary.public.loginHint}
          </button>
        </footer>
      </div>

      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </main>
  );
}

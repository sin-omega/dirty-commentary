// app/page.tsx
import Link from 'next/link';
import { MessageCircle, LogIn } from 'lucide-react';
import { dictionary, splitBrandName } from '@/lib/dictionary';
import { SubmissionForm } from '@/components/public/SubmissionForm';

export default function HomePage() {
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL;
  const { baseName, accent } = splitBrandName();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-page px-4 py-6 sm:py-10">
      <div className="flex w-full max-w-[420px] flex-1 flex-col justify-center gap-5 sm:flex-none">
        {/* Nagłówek - statyczny */}
        <header className="flex flex-col items-center gap-2 text-center">
          <span className="rounded-pill border-2 border-bg-ink bg-white px-3 py-1 text-xs font-medium text-bg-ink/70">
            {dictionary.brand.eyebrow}
          </span>
          <h1 className="font-display text-3xl font-extrabold leading-tight text-bg-ink sm:text-4xl">
            {baseName}
            <span className="text-accent">{accent}</span>
          </h1>
          <p className="text-sm text-bg-ink/70">{dictionary.public.subtitle}</p>
        </header>

        {/* Środek - dynamiczny formularz */}
        <SubmissionForm />

        {/* Stopka - statyczna */}
        <footer className="flex flex-col items-center gap-3 pt-1">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-pill border-2 border-bg-ink bg-whatsapp px-5 py-3 font-display font-semibold text-whatsapp-fg shadow-chunky transition-colors hover:bg-whatsapp/90"
            >
              <MessageCircle size={20} />
              {dictionary.public.whatsappCta}
            </a>
          ) : null}

          <Link
            href="/admin/login"
            className="inline-flex items-center gap-1.5 text-xs text-bg-ink/50 hover:text-bg-ink/80"
          >
            <LogIn size={13} />
            {dictionary.public.loginHint}
          </Link>
        </footer>
      </div>
    </main>
  );
}

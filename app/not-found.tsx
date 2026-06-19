// app/not-found.tsx
import Link from 'next/link';
import { dictionary } from '@/lib/dictionary';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-page px-4 text-center">
      <h1 className="font-display text-4xl font-extrabold text-bg-ink">
        {dictionary.common.notFoundTitle}
      </h1>
      <p className="text-bg-ink/60">{dictionary.common.notFoundSubtitle}</p>
      <Link
        href="/"
        className="touch-target rounded-pill border-2 border-bg-ink bg-white px-5 py-2.5 font-display font-semibold text-bg-ink hover:bg-accent-soft"
      >
        {dictionary.common.notFoundCta}
      </Link>
    </main>
  );
}

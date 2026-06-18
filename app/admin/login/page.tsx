// app/admin/login/page.tsx
import Link from 'next/link';
import { dictionary } from '@/lib/dictionary';
import { LoginForm } from '@/components/admin/LoginForm';

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-page px-4 py-10">
      <LoginForm />
      <Link href="/" className="text-sm text-bg-ink/50 hover:text-bg-ink/80">
        {dictionary.adminLogin.backToPublic}
      </Link>
    </main>
  );
}

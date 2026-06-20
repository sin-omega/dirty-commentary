// app/admin/login/page.tsx
import { LoginForm } from '@/components/admin/LoginForm';

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-page px-4 py-10">
      <LoginForm />
    </main>
  );
}

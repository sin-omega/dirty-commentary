// app/admin/activate/[token]/page.tsx
import { ActivateForm } from '@/components/admin/ActivateForm';

export default function ActivatePage({ params }: { params: { token: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-page px-4 py-10">
      <ActivateForm token={params.token} />
    </main>
  );
}

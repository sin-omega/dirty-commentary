// components/admin/LogoutButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { dictionary } from '@/lib/dictionary';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      title={dictionary.adminQueue.logoutCta}
      className="touch-target flex items-center justify-center rounded-full text-bg-ink/60 hover:bg-black/5 hover:text-bg-ink"
    >
      <LogOut size={20} />
    </button>
  );
}

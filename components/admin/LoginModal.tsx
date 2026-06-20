// components/admin/LoginModal.tsx
'use client';

import { X } from 'lucide-react';
import { LoginForm } from '@/components/admin/LoginForm';
import { dictionary } from '@/lib/dictionary';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-[400px]">
        <button
          onClick={onClose}
          className="absolute -right-2 -top-2 z-10 flex items-center justify-center text-bg-ink/60 hover:text-bg-ink"
          aria-label={dictionary.common.close}
        >
          <X size={22} />
        </button>
        <LoginForm />
      </div>
    </div>
  );
}

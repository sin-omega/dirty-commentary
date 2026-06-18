// components/ui/Toast.tsx
'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string;
  show: boolean;
  onHide: () => void;
  durationMs?: number;
}

export function Toast({ message, show, onHide, durationMs = 2200 }: ToastProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onHide();
    }, durationMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, durationMs]);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-pill border-2 border-bg-ink bg-bubble px-5 py-3 font-medium text-bg-ink shadow-chunky animate-fade-slide-in"
    >
      <Check size={18} className="shrink-0" />
      <span>{message}</span>
    </div>
  );
}

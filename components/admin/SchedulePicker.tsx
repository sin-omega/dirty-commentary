// components/admin/SchedulePicker.tsx
'use client';

import { useState } from 'react';
import { dictionary } from '@/lib/dictionary';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface SchedulePickerProps {
  open: boolean;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

function todayDateString(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function nowTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function SchedulePicker({ open, onConfirm, onCancel, isSaving }: SchedulePickerProps) {
  const [date, setDate] = useState(todayDateString());
  const [time, setTime] = useState(nowTimeString());
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleConfirm() {
    const combined = new Date(`${date}T${time}:00`);
    if (Number.isNaN(combined.getTime()) || combined.getTime() < Date.now()) {
      setError(dictionary.editor.schedulePastError);
      return;
    }
    setError(null);
    onConfirm(combined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <Card className="w-full max-w-[340px] p-6">
        <h2 className="mb-4 font-display text-lg font-bold text-bg-ink">
          {dictionary.editor.schedulePickerTitle}
        </h2>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="schedule-date" className="text-sm font-semibold text-bg-ink">
              {dictionary.editor.scheduleDateLabel}
            </label>
            <input
              id="schedule-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="touch-target rounded-card border-2 border-bg-ink/20 px-3 py-2 outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="schedule-time" className="text-sm font-semibold text-bg-ink">
              {dictionary.editor.scheduleTimeLabel}
            </label>
            <input
              id="schedule-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="touch-target rounded-card border-2 border-bg-ink/20 px-3 py-2 outline-none focus:border-accent"
            />
          </div>

          {error && <p className="text-sm text-danger-fg">{error}</p>}

          <div className="mt-2 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={isSaving}>
              {dictionary.editor.scheduleCancelCta}
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleConfirm} isLoading={isSaving}>
              {dictionary.editor.scheduleConfirmCta}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

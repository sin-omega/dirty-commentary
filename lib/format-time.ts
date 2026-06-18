// lib/format-time.ts
import { dictionary } from '@/lib/dictionary';

/**
 * Formatuje datę ISO jako relatywny czas po polsku ("2h temu", "przed chwilą").
 */
export function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return dictionary.adminQueue.relativeJustNow;
  if (diffMinutes < 60) return dictionary.adminQueue.relativeMinutesAgo(diffMinutes);

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return dictionary.adminQueue.relativeHoursAgo(diffHours);

  const diffDays = Math.floor(diffHours / 24);
  return dictionary.adminQueue.relativeDaysAgo(diffDays);
}

/**
 * Formatuje datę ISO jako czytelną datę+godzinę po polsku, np. "17 cze, 14:30".
 */
export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString('pl-PL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

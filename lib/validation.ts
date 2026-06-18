// lib/validation.ts

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/heic', 'image/webp'];
export const MAX_NICKNAME_LENGTH = 50;

export function isValidImageFile(file: File): { valid: boolean; reason?: 'size' | 'type' } {
  if (file.size > MAX_FILE_SIZE_BYTES) return { valid: false, reason: 'size' };
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return { valid: false, reason: 'type' };
  return { valid: true };
}

const URL_PATTERN = /^https?:\/\/.+\..+/i;

export function isValidUrl(value: string): boolean {
  if (!value.trim()) return true; // pole opcjonalne, puste jest OK
  return URL_PATTERN.test(value.trim());
}

export function isValidNickname(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_NICKNAME_LENGTH;
}

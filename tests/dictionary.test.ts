// tests/dictionary.test.ts
import { describe, it, expect } from 'vitest';
import { splitBrandName, dictionary } from '@/lib/dictionary';

describe('splitBrandName', () => {
  it('dzieli nazwę marki na bazę i akcent zgodnie z dictionary.brand', () => {
    const { baseName, accent } = splitBrandName();
    expect(baseName + accent).toBe(dictionary.brand.name);
    expect(accent).toBe(dictionary.brand.titleAccent);
  });
});

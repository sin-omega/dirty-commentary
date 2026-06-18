// tests/textarea-formatting.test.ts
import { describe, it, expect } from 'vitest';
import { wrapSelection, prefixLines } from '@/lib/textarea-formatting';

describe('wrapSelection', () => {
  it('owija zaznaczony tekst znacznikami', () => {
    const result = wrapSelection(
      { text: 'hello world', selectionStart: 0, selectionEnd: 5 },
      '*'
    );
    expect(result.text).toBe('*hello* world');
  });

  it('wstawia parę znaczników z kursorem między nimi gdy nic nie zaznaczone', () => {
    const result = wrapSelection(
      { text: 'hello world', selectionStart: 5, selectionEnd: 5 },
      '*'
    );
    expect(result.text).toBe('hello** world');
    expect(result.selectionStart).toBe(6);
    expect(result.selectionEnd).toBe(6);
  });

  it('działa dla zaznaczenia w środku dłuższego tekstu', () => {
    const result = wrapSelection(
      { text: 'abc def ghi', selectionStart: 4, selectionEnd: 7 },
      '_'
    );
    expect(result.text).toBe('abc _def_ ghi');
  });
});

describe('prefixLines', () => {
  it('dodaje prefix do pojedynczej linii (kursor bez zaznaczenia)', () => {
    const result = prefixLines(
      { text: 'jedna linia', selectionStart: 3, selectionEnd: 3 },
      () => '- '
    );
    expect(result.text).toBe('- jedna linia');
  });

  it('dodaje prefix do każdej zaznaczonej linii', () => {
    const text = 'pierwsza\ndruga\ntrzecia';
    const result = prefixLines(
      { text, selectionStart: 0, selectionEnd: text.length },
      () => '- '
    );
    expect(result.text).toBe('- pierwsza\n- druga\n- trzecia');
  });

  it('numeruje rosnąco dla listy numerowanej', () => {
    const text = 'a\nb\nc';
    const result = prefixLines(
      { text, selectionStart: 0, selectionEnd: text.length },
      (i) => `${i + 1}. `
    );
    expect(result.text).toBe('1. a\n2. b\n3. c');
  });

  it('nie dotyka linii poza zaznaczeniem', () => {
    const text = 'pierwsza\ndruga\ntrzecia';
    // zaznaczenie tylko w "druga"
    const start = text.indexOf('druga');
    const end = start + 'druga'.length;
    const result = prefixLines({ text, selectionStart: start, selectionEnd: end }, () => '> ');
    expect(result.text).toBe('pierwsza\n> druga\ntrzecia');
  });
});

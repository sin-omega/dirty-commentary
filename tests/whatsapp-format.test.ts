// tests/whatsapp-format.test.ts
import { describe, it, expect } from 'vitest';
import {
  applyVariables,
  buildFinalMessage,
  renderWhatsAppMarkdownToHtml,
} from '@/lib/whatsapp-format';

describe('applyVariables', () => {
  it('podstawia %sender% i %channel_link%', () => {
    const result = applyVariables('cześć %sender%, zobacz %channel_link%', {
      sender: 'anka92',
      channelLink: 'https://example.com',
    });
    expect(result).toBe('cześć anka92, zobacz https://example.com');
  });

  it('podstawia wielokrotnie powtórzoną zmienną', () => {
    const result = applyVariables('%sender% i jeszcze raz %sender%', {
      sender: 'kasia',
    });
    expect(result).toBe('kasia i jeszcze raz kasia');
  });

  it('zamienia %channel_link% na pusty string gdy channelLink jest undefined', () => {
    const result = applyVariables('link: %channel_link%', { sender: 'x' });
    expect(result).toBe('link: ');
  });

  it('zamienia %channel_link% na pusty string gdy channelLink jest null', () => {
    const result = applyVariables('link: %channel_link%', { sender: 'x', channelLink: null });
    expect(result).toBe('link: ');
  });

  it('nie crashuje na pustym stringu', () => {
    expect(applyVariables('', { sender: 'x' })).toBe('');
  });
});

describe('buildFinalMessage', () => {
  it('dokleja podpis po dwóch nowych liniach', () => {
    const result = buildFinalMessage('treść %sender%', {
      sender: 'anka',
      signature: '*— Kasia*',
    });
    expect(result).toBe('treść anka\n\n*— Kasia*');
  });

  it('nie dokleja pustego podpisu (brak zbędnych nowych linii)', () => {
    const result = buildFinalMessage('treść', { sender: 'anka', signature: '' });
    expect(result).toBe('treść');
  });

  it('podstawia zmienne przed dołączeniem podpisu', () => {
    const result = buildFinalMessage('od %sender%, link %channel_link%', {
      sender: 'anka',
      channelLink: 'https://x.com',
      signature: 'podpis',
    });
    expect(result).toBe('od anka, link https://x.com\n\npodpis');
  });
});

describe('renderWhatsAppMarkdownToHtml - formaty otaczające', () => {
  it('renderuje bold', () => {
    expect(renderWhatsAppMarkdownToHtml('*tekst*')).toContain('<strong>tekst</strong>');
  });

  it('renderuje italic', () => {
    expect(renderWhatsAppMarkdownToHtml('_tekst_')).toContain('<em>tekst</em>');
  });

  it('renderuje strikethrough', () => {
    expect(renderWhatsAppMarkdownToHtml('~tekst~')).toContain('<s>tekst</s>');
  });

  it('rozróżnia inline code od monospace block bez kolizji', () => {
    const inline = renderWhatsAppMarkdownToHtml('to jest `kod` w linii');
    expect(inline).toContain('wa-inline-code');
    expect(inline).not.toContain('wa-mono-block');

    const block = renderWhatsAppMarkdownToHtml('```blok kodu```');
    expect(block).toContain('wa-mono-block');
    expect(block).not.toContain('wa-inline-code');
  });

  it('poprawnie zagnieżdża wiele formatów otaczających w jednej linii', () => {
    const result = renderWhatsAppMarkdownToHtml('*bold* i _italic_ i ~strike~');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('<em>italic</em>');
    expect(result).toContain('<s>strike</s>');
  });

  it('escapuje HTML wewnątrz treści (bezpieczeństwo XSS)', () => {
    const result = renderWhatsAppMarkdownToHtml('<script>alert(1)</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
});

describe('renderWhatsAppMarkdownToHtml - formaty od początku linii', () => {
  it('grupuje kolejne linie listy punktowanej w jeden <ul>', () => {
    const result = renderWhatsAppMarkdownToHtml('- pierwszy\n- drugi\n- trzeci');
    const ulMatches = result.match(/<ul/g);
    expect(ulMatches?.length).toBe(1);
    expect(result).toContain('<li>pierwszy</li>');
    expect(result).toContain('<li>drugi</li>');
    expect(result).toContain('<li>trzeci</li>');
  });

  it('grupuje kolejne linie listy numerowanej w jeden <ol>', () => {
    const result = renderWhatsAppMarkdownToHtml('1. raz\n2. dwa\n3. trzy');
    const olMatches = result.match(/<ol/g);
    expect(olMatches?.length).toBe(1);
  });

  it('grupuje kolejne linie cytatu w jeden <blockquote>', () => {
    const result = renderWhatsAppMarkdownToHtml('> linia 1\n> linia 2');
    const quoteMatches = result.match(/<blockquote/g);
    expect(quoteMatches?.length).toBe(1);
    expect(result).toContain('linia 1');
    expect(result).toContain('linia 2');
  });

  it('nie grupuje list przedzielonych zwykłym tekstem', () => {
    const result = renderWhatsAppMarkdownToHtml('- a\ntekst\n- b');
    const ulMatches = result.match(/<ul/g);
    expect(ulMatches?.length).toBe(2);
  });

  it('zwykła linia tekstu jest renderowana jako tekst z formatowaniem inline', () => {
    const result = renderWhatsAppMarkdownToHtml('zwykła *pogrubiona* linia');
    expect(result).toContain('<strong>pogrubiona</strong>');
    expect(result).not.toContain('<li>');
  });
});

describe('renderWhatsAppMarkdownToHtml - przypadki brzegowe', () => {
  it('nie crashuje na pustym stringu', () => {
    expect(renderWhatsAppMarkdownToHtml('')).toBe('');
  });

  it('nie crashuje na samych nowych liniach', () => {
    expect(() => renderWhatsAppMarkdownToHtml('\n\n\n')).not.toThrow();
  });

  it('obsługuje tekst bez żadnego formatowania', () => {
    const result = renderWhatsAppMarkdownToHtml('zwykły tekst bez niczego');
    expect(result).toContain('zwykły tekst bez niczego');
  });
});

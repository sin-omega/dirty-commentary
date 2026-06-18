// lib/whatsapp-format.ts
//
// Trzy niezależne, czyste funkcje:
// - applyVariables: podstawia %sender% / %channel_link%
// - buildFinalMessage: łączy tekst + podpis w finalną wiadomość do schowka
// - renderWhatsAppMarkdownToHtml: konwertuje surowy markdown WhatsApp na HTML
//   do wizualnego podglądu (NIE używane przy kopiowaniu do schowka — tam
//   leci surowy tekst, bo WhatsApp sam interpretuje znaczniki po wklejeniu).

export interface VariableContext {
  sender: string;
  channelLink?: string | null;
}

export interface FinalMessageContext extends VariableContext {
  signature: string;
}

/**
 * Podstawia placeholdery %sender% i %channel_link% w tekście.
 * Zmienne mogą się powtórzyć wielokrotnie - replaceAll obsługuje to poprawnie.
 * Jeśli channelLink nie jest podany, %channel_link% zamienia się na pusty string.
 */
export function applyVariables(text: string, context: VariableContext): string {
  if (!text) return '';
  return text
    .replaceAll('%sender%', context.sender ?? '')
    .replaceAll('%channel_link%', context.channelLink ?? '');
}

/**
 * Łączy podstawiony tekst z podpisem w finalną wiadomość do skopiowania.
 * To trafia do schowka przy "kopiuj do WhatsApp" i to jest renderowane
 * (po przejściu przez renderWhatsAppMarkdownToHtml) w żywym podglądzie.
 */
export function buildFinalMessage(rawComment: string, context: FinalMessageContext): string {
  const withVariables = applyVariables(rawComment, context);
  const signature = context.signature?.trim() ?? '';
  if (!signature) return withVariables;
  return `${withVariables}\n\n${signature}`;
}

// --- Renderowanie do podglądu (HTML string, wstrzykiwane przez dangerouslySetInnerHTML
// w komponencie podglądu po escapowaniu wejścia) ---

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Przetwarza formaty "otaczające" (bold/italic/strikethrough/code) w obrębie
 * jednej linii (lub fragmentu linii, np. treści cytatu). Kolejność jest
 * istotna: monospace block -> inline code -> bold -> italic -> strikethrough,
 * żeby backticki nie kolidowały z innymi znacznikami.
 *
 * Wejście jest już zescapowane HTML-em (encode &, <, >) PRZED wejściem tutaj,
 * żeby treść użytkownika nie wstrzyknęła HTML - ta funkcja tylko dokleja
 * bezpieczne tagi wokół dopasowanych fragmentów.
 */
function processInlineFormatting(escapedLine: string): string {
  let result = escapedLine;

  // Monospace block ```tekst``` - sprawdzane jako pierwsze (najbardziej
  // "zewnętrzny" znacznik), żeby nie kolidowało z inline code.
  result = result.replace(/```([^`\n]+)```/g, '<code class="wa-mono-block">$1</code>');

  // Inline code `tekst` - sprawdzane po monospace block, żeby nie złapać
  // backticków będących już częścią potrójnego znacznika (te są już
  // skonsumowane powyżej, więc pozostałe pojedyncze backtické są bezpieczne).
  result = result.replace(/`([^`\n]+)`/g, '<code class="wa-inline-code">$1</code>');

  // Bold *tekst* - granica: nie łapiemy pustych gwiazdek ani nowej linii w środku.
  result = result.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');

  // Italic _tekst_
  result = result.replace(/_([^_\n]+)_/g, '<em>$1</em>');

  // Strikethrough ~tekst~
  result = result.replace(/~([^~\n]+)~/g, '<s>$1</s>');

  return result;
}

type LineType = 'bullet' | 'numbered' | 'quote' | 'text';

interface ParsedLine {
  type: LineType;
  content: string; // treść linii PO usunięciu prefixu, PRZED inline formatting
}

const BULLET_PATTERN = /^[-*]\s+(.*)$/;
const NUMBERED_PATTERN = /^\d+\.\s+(.*)$/;
const QUOTE_PATTERN = /^>\s+(.*)$/;

function classifyLine(line: string): ParsedLine {
  const bulletMatch = line.match(BULLET_PATTERN);
  if (bulletMatch) return { type: 'bullet', content: bulletMatch[1] };

  const numberedMatch = line.match(NUMBERED_PATTERN);
  if (numberedMatch) return { type: 'numbered', content: numberedMatch[1] };

  const quoteMatch = line.match(QUOTE_PATTERN);
  if (quoteMatch) return { type: 'quote', content: quoteMatch[1] };

  return { type: 'text', content: line };
}

/**
 * Konwertuje surowy tekst WhatsApp markdown na bezpieczny HTML string do
 * wizualnego podglądu. Linie sprawdzane per-linia (nie jednym regexem na
 * całym stringu) - kolejne linie tego samego typu listy/cytatu grupowane
 * we wspólny kontener.
 */
export function renderWhatsAppMarkdownToHtml(rawText: string): string {
  if (!rawText) return '';

  const lines = rawText.split('\n');
  const parsedLines = lines.map(classifyLine);

  const htmlParts: string[] = [];
  let i = 0;

  while (i < parsedLines.length) {
    const current = parsedLines[i];

    if (current.type === 'text') {
      // Linia pusta -> odstęp (kolejne <br/>); w przeciwnym razie tekst z inline formatting.
      const escaped = escapeHtml(current.content);
      const formatted = processInlineFormatting(escaped);
      htmlParts.push(formatted === '' ? '<br/>' : `<span class="wa-line">${formatted}</span><br/>`);
      i += 1;
      continue;
    }

    // Grupuj kolejne linie tego samego typu (bullet / numbered / quote).
    const groupType = current.type;
    const groupItems: string[] = [];

    while (i < parsedLines.length && parsedLines[i].type === groupType) {
      const escaped = escapeHtml(parsedLines[i].content);
      groupItems.push(processInlineFormatting(escaped));
      i += 1;
    }

    if (groupType === 'bullet') {
      const items = groupItems.map((item) => `<li>${item}</li>`).join('');
      htmlParts.push(`<ul class="wa-list">${items}</ul>`);
    } else if (groupType === 'numbered') {
      const items = groupItems.map((item) => `<li>${item}</li>`).join('');
      htmlParts.push(`<ol class="wa-list-numbered">${items}</ol>`);
    } else if (groupType === 'quote') {
      const items = groupItems.join('<br/>');
      htmlParts.push(`<blockquote class="wa-quote">${items}</blockquote>`);
    }
  }

  return htmlParts.join('');
}

// lib/textarea-formatting.ts
//
// Czyste funkcje manipulujące tekstem + pozycją kursora/zaznaczenia w textarea,
// używane przez toolbar formatowania w edytorze komentarza (sekcja 5.3).

export interface TextSelection {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

export interface FormattingResult {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

/**
 * Owija zaznaczony fragment parą znaczników (np. * dla bold). Jeśli nic nie
 * jest zaznaczone, wstawia parę znaczników w pozycji kursora z kursorem
 * między nimi.
 */
export function wrapSelection(
  { text, selectionStart, selectionEnd }: TextSelection,
  marker: string
): FormattingResult {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  const newText = `${before}${marker}${selected}${marker}${after}`;

  if (selected.length === 0) {
    // Nic nie zaznaczone: kursor między znacznikami.
    const cursorPos = selectionStart + marker.length;
    return { text: newText, selectionStart: cursorPos, selectionEnd: cursorPos };
  }

  // Coś zaznaczone: zaznaczenie przesuwa się o długość markera, obejmuje
  // oryginalny tekst (teraz otoczony znacznikami).
  return {
    text: newText,
    selectionStart: selectionStart + marker.length,
    selectionEnd: selectionEnd + marker.length,
  };
}

/**
 * Dodaje prefix na początku aktualnej linii kursora, albo na początku
 * każdej zaznaczonej linii jeśli zaznaczenie obejmuje wiele linii.
 * Dla list numerowanych, numeruje rosnąco (1. , 2. , 3. ...).
 */
export function prefixLines(
  { text, selectionStart, selectionEnd }: TextSelection,
  prefixBuilder: (lineIndex: number) => string
): FormattingResult {
  // Znajdź początek linii zawierającej selectionStart.
  let lineStart = selectionStart;
  while (lineStart > 0 && text[lineStart - 1] !== '\n') lineStart -= 1;

  // Znajdź koniec linii zawierającej selectionEnd.
  let lineEnd = selectionEnd;
  while (lineEnd < text.length && text[lineEnd] !== '\n') lineEnd += 1;

  const affectedBlock = text.slice(lineStart, lineEnd);
  const lines = affectedBlock.split('\n');

  let addedCharsTotal = 0;
  let addedCharsBeforeSelectionStart = 0;

  const newLines = lines.map((line, index) => {
    const prefix = prefixBuilder(index);
    addedCharsTotal += prefix.length;
    // Wszystkie linie przed pierwszą (czyli zawsze 0 dla index>=0 w tym blocku)
    // przesuwają początek zaznaczenia o swoją długość prefixu - ale tu liczymy
    // tylko offset dla pierwszej linii (selectionStart jest w niej zawsze na
    // początku bloku, więc przesuwa się o prefix pierwszej linii).
    if (index === 0) addedCharsBeforeSelectionStart = prefix.length;
    return `${prefix}${line}`;
  });

  const newBlock = newLines.join('\n');
  const newText = text.slice(0, lineStart) + newBlock + text.slice(lineEnd);

  return {
    text: newText,
    selectionStart: selectionStart + addedCharsBeforeSelectionStart,
    selectionEnd: selectionEnd + addedCharsTotal,
  };
}

export function bulletListPrefix(): FormattingResult['text'] {
  return '- ';
}

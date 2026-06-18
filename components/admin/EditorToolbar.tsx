// components/admin/EditorToolbar.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  ChevronDown,
} from 'lucide-react';
import { dictionary } from '@/lib/dictionary';

interface EditorToolbarProps {
  onWrapFormat: (marker: string) => void;
  onMonospaceBlock: () => void;
  onLinePrefix: (kind: 'bullet' | 'numbered' | 'quote') => void;
  onInsertVariable: (variable: string) => void;
  hasChannelLink: boolean;
}

export function EditorToolbar({
  onWrapFormat,
  onMonospaceBlock,
  onLinePrefix,
  onInsertVariable,
  hasChannelLink,
}: EditorToolbarProps) {
  const [variablesOpen, setVariablesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setVariablesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const iconBtnClass =
    'touch-target flex items-center justify-center rounded-card border-2 border-bg-ink/15 bg-white text-bg-ink hover:bg-accent-soft hover:border-bg-ink/30';

  return (
    <div className="sticky top-0 z-10 flex flex-col gap-2 bg-white pb-2">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          title={dictionary.editor.formatBold}
          onClick={() => onWrapFormat('*')}
          className={iconBtnClass}
        >
          <Bold size={17} />
        </button>
        <button
          type="button"
          title={dictionary.editor.formatItalic}
          onClick={() => onWrapFormat('_')}
          className={iconBtnClass}
        >
          <Italic size={17} />
        </button>
        <button
          type="button"
          title={dictionary.editor.formatStrikethrough}
          onClick={() => onWrapFormat('~')}
          className={iconBtnClass}
        >
          <Strikethrough size={17} />
        </button>
        <button
          type="button"
          title={dictionary.editor.formatInlineCode}
          onClick={() => onWrapFormat('`')}
          className={`${iconBtnClass} text-sm font-mono`}
        >
          {dictionary.editor.formatInlineCodeSymbol}
        </button>
        <button
          type="button"
          title={dictionary.editor.formatMonospace}
          onClick={onMonospaceBlock}
          className={iconBtnClass}
        >
          <Code size={17} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          title={dictionary.editor.formatBulletList}
          onClick={() => onLinePrefix('bullet')}
          className={iconBtnClass}
        >
          <List size={17} />
        </button>
        <button
          type="button"
          title={dictionary.editor.formatNumberedList}
          onClick={() => onLinePrefix('numbered')}
          className={iconBtnClass}
        >
          <ListOrdered size={17} />
        </button>
        <button
          type="button"
          title={dictionary.editor.formatQuote}
          onClick={() => onLinePrefix('quote')}
          className={iconBtnClass}
        >
          <Quote size={17} />
        </button>

        <div className="ml-auto" ref={dropdownRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setVariablesOpen((v) => !v)}
              className="touch-target flex items-center gap-1.5 rounded-pill border-2 border-bg-ink bg-accent-soft px-4 py-2 text-sm font-semibold text-accent hover:bg-accent-soft/70"
            >
              {dictionary.editor.insertVariableCta}
              <ChevronDown size={15} />
            </button>

            {variablesOpen && (
              <ul className="absolute right-0 z-20 mt-2 w-64 rounded-card border-2 border-bg-ink bg-white p-1.5 shadow-chunky">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onInsertVariable('%sender%');
                      setVariablesOpen(false);
                    }}
                    className="flex w-full flex-col items-start gap-0.5 rounded-card px-3 py-2 text-left hover:bg-accent-soft"
                  >
                    <span className="font-mono text-sm font-semibold text-bg-ink">
                      {dictionary.editor.senderVarLabel}
                    </span>
                    <span className="text-xs text-bg-ink/60">{dictionary.editor.senderVarHint}</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onInsertVariable('%channel_link%');
                      setVariablesOpen(false);
                    }}
                    className="flex w-full flex-col items-start gap-0.5 rounded-card px-3 py-2 text-left hover:bg-accent-soft"
                  >
                    <span className="font-mono text-sm font-semibold text-bg-ink">
                      {dictionary.editor.channelVarLabel}
                    </span>
                    <span className="text-xs text-bg-ink/60">
                      {dictionary.editor.channelVarHint}
                      {!hasChannelLink && ` (${dictionary.editor.noChannelLink})`}
                    </span>
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

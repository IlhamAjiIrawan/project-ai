'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (messageText: string) => void;
  onStopGeneration: () => void;
  disabled?: boolean;
}

const QUICK_ACTIONS = [
  { label: '*tersenyum*', text: '*tersenyum lembut*' },
  { label: '*terkejut*', text: '*terbelalak kaget*' },
  { label: '*berbisik*', text: '*berbisik pelan ke arahmu*' },
  { label: '*menghela nafas*', text: '*menghela nafas panjang*' },
  { label: '(OOC: )', text: '(OOC: ' },
];

export function ChatInput({ onSendMessage, onStopGeneration, disabled }: ChatInputProps) {
  const { isGenerating, theme } = useAppStore();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (isGenerating) {
      onStopGeneration();
      return;
    }
    if (!input.trim() || disabled) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleInsertQuickAction = (textToInsert: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart || 0;
      const end = textareaRef.current.selectionEnd || 0;
      const currentVal = input;
      const newVal = currentVal.substring(0, start) + textToInsert + ' ' + currentVal.substring(end);
      setInput(newVal);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newPos = start + textToInsert.length + 1;
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    } else {
      setInput((prev) => (prev ? prev + ' ' + textToInsert : textToInsert));
    }
  };

  return (
    <div className={`p-3 md:p-4 border-t shrink-0 space-y-2 transition-colors ${
      isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white'
    }`}>
      {/* Quick Action Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        {QUICK_ACTIONS.map((action, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleInsertQuickAction(action.text)}
            className={`whitespace-nowrap px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer shrink-0 ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Main Input Box */}
      <div className={`relative flex items-end gap-2 rounded-xl border p-1.5 transition-colors ${
        isDark
          ? 'bg-zinc-900/70 border-zinc-800 focus-within:border-zinc-600'
          : 'bg-zinc-50 border-zinc-200 focus-within:border-zinc-400'
      }`}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tulis pesan atau *narasi peran*... (Enter kirim, Shift+Enter baris baru)"
          disabled={disabled}
          className={`flex-1 max-h-40 min-h-[36px] bg-transparent text-xs sm:text-sm px-2.5 py-1.5 resize-none focus:outline-none scrollbar-none ${
            isDark ? 'text-zinc-100 placeholder:text-zinc-500' : 'text-zinc-900 placeholder:text-zinc-400'
          }`}
        />

        {/* Send / Stop Button */}
        {isGenerating ? (
          <button
            onClick={onStopGeneration}
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer shrink-0"
            title="Hentikan pembuatan respon"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            type="button"
            className={`flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shrink-0 ${
              isDark
                ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                : 'bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
            title="Kirim pesan"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

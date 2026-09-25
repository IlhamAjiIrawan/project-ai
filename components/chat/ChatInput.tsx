'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Send, Square, Sparkles, MessageSquareCode, CornerDownLeft } from 'lucide-react';

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
  { label: '*menatap lekat*', text: '*menatap matamu dengan lekat*' },
  { label: '(OOC: )', text: '(OOC: ' },
];

export function ChatInput({ onSendMessage, onStopGeneration, disabled }: ChatInputProps) {
  const { isGenerating } = useAppStore();
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
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
    <div className="p-3 md:p-4 glass-panel border-t border-white/10 shrink-0 space-y-2">
      {/* Quick Action Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold shrink-0 hidden sm:inline">
          Aksi Cepat:
        </span>
        {QUICK_ACTIONS.map((action, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleInsertQuickAction(action.text)}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 text-[11px] font-mono transition-all cursor-pointer shrink-0"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Main Input Box */}
      <div className="relative flex items-end gap-2 bg-zinc-900/70 rounded-2xl border border-white/10 p-1.5 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/30 transition-all">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tulis dialog atau *tindakan/narasi peranmu*... (Enter untuk kirim, Shift+Enter baris baru)"
          disabled={disabled}
          className="flex-1 max-h-44 min-h-[38px] bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 px-3 py-2 resize-none focus:outline-none scrollbar-none"
        />

        {/* Send / Stop Button */}
        {isGenerating ? (
          <button
            onClick={onStopGeneration}
            type="button"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md shadow-rose-500/20 cursor-pointer shrink-0"
            title="Hentikan pembuatan respon"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Stop</span>
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            type="button"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 disabled:opacity-30 disabled:pointer-events-none text-white transition-all shadow-md shadow-cyan-500/20 cursor-pointer shrink-0"
            title="Kirim pesan"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

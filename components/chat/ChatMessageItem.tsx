'use client';

import React, { useState } from 'react';
import { Character, ChatMessage, UserPersona } from '@/types';
import { ChatMessageFormatter } from './ChatMessageFormatter';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  Edit3,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  Sparkles,
  Bot,
  User,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

interface ChatMessageItemProps {
  message: ChatMessage;
  character: Character;
  persona?: UserPersona;
  onReroll?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onSwipeChange?: (messageId: string, newIndex: number) => void;
  isLastAssistantMessage?: boolean;
}

export function ChatMessageItem({
  message,
  character,
  persona,
  onReroll,
  onEdit,
  onDelete,
  onSwipeChange,
  isLastAssistantMessage = false,
}: ChatMessageItemProps) {
  const { isGenerating, settings } = useAppStore();

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Swipe logic
  const swipes = message.swipes || [message.content];
  const currentSwipeIdx = message.currentSwipeIndex ?? swipes.length - 1;
  const currentContent = swipes[currentSwipeIdx] || message.content;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean asterisks for cleaner speech
    const cleanText = currentContent.replace(/\*[^*]+\*/g, '').replace(/["]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText || currentContent);

    if (settings.ttsVoice) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => v.name === settings.ttsVoice);
      if (voice) utterance.voice = voice;
    }
    utterance.rate = settings.ttsRate || 1.0;
    utterance.pitch = settings.ttsPitch || 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim()) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handlePrevSwipe = () => {
    if (currentSwipeIdx > 0 && onSwipeChange) {
      onSwipeChange(message.id, currentSwipeIdx - 1);
    }
  };

  const handleNextSwipe = () => {
    if (currentSwipeIdx < swipes.length - 1 && onSwipeChange) {
      onSwipeChange(message.id, currentSwipeIdx + 1);
    }
  };

  return (
    <div
      className={`group relative flex gap-3.5 p-3 md:p-4 rounded-2xl transition-all duration-200 ${
        isUser
          ? 'bg-zinc-900/40 border border-white/5 ml-4 sm:ml-12'
          : 'bg-zinc-950/70 border border-white/10 mr-4 sm:mr-12 hover:border-cyan-500/20'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {isUser ? (
          persona?.avatar ? (
            <img
              src={persona.avatar}
              alt={persona.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-cyan-500/30"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
          )
        ) : character.avatar ? (
          <img
            src={character.avatar}
            alt={character.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/30"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
            <Bot className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0 space-y-1.5">
        {/* Name & Metadata Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${isUser ? 'text-cyan-300' : 'text-purple-300'}`}>
              {isUser ? persona?.name || 'Kamu' : character.name}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">{formatDate(message.timestamp)}</span>
            {message.modelUsed && isAssistant && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-zinc-400 font-mono hidden sm:inline">
                {message.modelUsed}
              </span>
            )}
          </div>

          {/* Swipe Indicator */}
          {swipes.length > 1 && isAssistant && (
            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              <button
                onClick={handlePrevSwipe}
                disabled={currentSwipeIdx === 0}
                className="hover:text-cyan-400 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>
                {currentSwipeIdx + 1} / {swipes.length}
              </span>
              <button
                onClick={handleNextSwipe}
                disabled={currentSwipeIdx === swipes.length - 1}
                className="hover:text-cyan-400 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Message Content or Inline Edit */}
        {isEditing ? (
          <div className="space-y-2 mt-1">
            <textarea
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2.5 rounded-xl glass-input text-sm font-sans resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 rounded-lg text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan
              </button>
            </div>
          </div>
        ) : (
          <ChatMessageFormatter content={currentContent} />
        )}

        {/* Action Toolbar on Message Hover */}
        {!isEditing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 pt-1">
            <button
              onClick={handleCopy}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 text-xs transition-colors cursor-pointer"
              title="Salin Pesan"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleSpeak}
              className={`p-1 rounded-md hover:bg-white/10 text-xs transition-colors cursor-pointer ${
                isSpeaking ? 'text-cyan-400' : 'text-zinc-400 hover:text-white'
              }`}
              title="Dengarkan Suara (TTS)"
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                setEditContent(currentContent);
                setIsEditing(true);
              }}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 text-xs transition-colors cursor-pointer"
              title="Edit Pesan"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {isAssistant && isLastAssistantMessage && !isGenerating && onReroll && (
              <button
                onClick={() => onReroll(message.id)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-zinc-400 hover:text-cyan-300 hover:bg-cyan-500/10 text-[11px] transition-colors cursor-pointer"
                title="Hasilkan Alternatif Respon Lain (Reroll)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reroll</span>
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="p-1 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs transition-colors cursor-pointer"
                title="Hapus Pesan"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

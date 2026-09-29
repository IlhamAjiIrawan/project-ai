'use client';

import React, { useState, useEffect } from 'react';
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
  Bot,
  User,
  Brain,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { extractMoodFromText } from '@/lib/mood';

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
  const { isGenerating, settings, theme, setPinMemoryModalData } = useAppStore();

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isDark = theme === 'dark';

  const swipes = message.swipes || [message.content];
  const currentSwipeIdx = message.currentSwipeIndex ?? swipes.length - 1;
  const currentContent = swipes[currentSwipeIdx] || message.content;

  // Extract dynamic mood badge & clean content
  const { cleanText, moodInfo } = isAssistant
    ? extractMoodFromText(currentContent)
    : { cleanText: currentContent, moodInfo: null };

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(cleanText);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setEditContent(cleanText);
    }
  }, [cleanText, isEditing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanText);
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

    const speakableText = cleanText.replace(/\*[^*]+\*/g, '').replace(/["]/g, '');
    const utterance = new SpeechSynthesisUtterance(speakableText || cleanText);

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
      className={`group relative flex gap-3 p-3 sm:p-4 rounded-xl transition-colors ${
        isUser
          ? isDark
            ? 'bg-zinc-900/40 border border-zinc-800/60 ml-3 sm:ml-10'
            : 'bg-zinc-100 border border-zinc-200 ml-3 sm:ml-10'
          : isDark
            ? 'bg-zinc-950 border border-zinc-800/80 mr-3 sm:mr-10'
            : 'bg-white border border-zinc-200 mr-3 sm:mr-10 shadow-sm'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {isUser ? (
          persona?.avatar ? (
            <img
              src={persona.avatar}
              alt={persona.name}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
              isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-700'
            }`}>
              <User className="w-3.5 h-3.5" />
            </div>
          )
        ) : character.avatar ? (
          <img
            src={character.avatar}
            alt={character.name}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
            isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-700'
          }`}>
            <Bot className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Header info */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold">
              {isUser ? persona?.name || 'Kamu' : character.name}
            </span>

            {/* Dynamic Mood Badge */}
            {isAssistant && moodInfo && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide shadow-sm transition-all hover:scale-105 ${moodInfo.badgeClass}`}
                title={`Suasana hati saat ini: ${moodInfo.label}`}
              >
                <span>{moodInfo.emoji}</span>
                <span className="capitalize">{moodInfo.label}</span>
              </span>
            )}

            <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {formatDate(message.timestamp)}
            </span>
            {message.modelUsed && isAssistant && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono hidden sm:inline ${
                isDark ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {message.modelUsed}
              </span>
            )}
          </div>

          {/* Swipe indicator */}
          {swipes.length > 1 && isAssistant && (
            <div className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
            }`}>
              <button
                onClick={handlePrevSwipe}
                disabled={currentSwipeIdx === 0}
                className="hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span>
                {currentSwipeIdx + 1}/{swipes.length}
              </span>
              <button
                onClick={handleNextSwipe}
                disabled={currentSwipeIdx === swipes.length - 1}
                className="hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Message body */}
        {isEditing ? (
          <div className="space-y-2 mt-1">
            <textarea
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={`w-full p-2.5 rounded-lg text-xs sm:text-sm font-sans resize-none border ${
                isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-zinc-300 text-zinc-900'
              }`}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                  isDark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                Simpan
              </button>
            </div>
          </div>
        ) : (
          <ChatMessageFormatter content={cleanText} />
        )}

        {/* Action Toolbar (visible on mobile, hover on desktop) */}
        {!isEditing && (
          <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center flex-wrap gap-1 pt-1.5">
            <button
              onClick={handleCopy}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'
              }`}
              title="Salin Pesan"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleSpeak}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                isSpeaking
                  ? 'text-zinc-100'
                  : isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'
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
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'
              }`}
              title="Edit Pesan"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setPinMemoryModalData({ messageContent: currentContent, role: message.role })}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-amber-400 hover:bg-zinc-800' : 'text-zinc-500 hover:text-amber-600 hover:bg-zinc-200'
              }`}
              title="Simpan ke Memori Karakter"
            >
              <Brain className="w-3.5 h-3.5" />
            </button>

            {isAssistant && isLastAssistantMessage && !isGenerating && onReroll && (
              <button
                onClick={() => onReroll(message.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  isDark ? 'text-zinc-300 hover:text-zinc-100 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800' : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200'
                }`}
                title="Reroll Respon"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reroll</span>
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="p-1.5 rounded-lg hover:text-rose-500 text-zinc-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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

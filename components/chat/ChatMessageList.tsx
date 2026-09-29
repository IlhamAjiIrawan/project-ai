'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Character, ChatMessage, UserPersona } from '@/types';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatMessageFormatter } from './ChatMessageFormatter';
import { useAppStore } from '@/lib/store';
import { extractMoodFromText } from '@/lib/mood';
import { ArrowDown, Bot } from 'lucide-react';

interface ChatMessageListProps {
  messages: ChatMessage[];
  character: Character;
  persona?: UserPersona;
  onReroll: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onDelete: (messageId: string) => void;
  onSwipeChange: (messageId: string, newIndex: number) => void;
}

export function ChatMessageList({
  messages,
  character,
  persona,
  onReroll,
  onEdit,
  onDelete,
  onSwipeChange,
}: ChatMessageListProps) {
  const { isGenerating, activeStreamingMessage, theme } = useAppStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const isDark = theme === 'dark';

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom(true);
    }
  }, [messages, activeStreamingMessage, isGenerating, showScrollBottom]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollBottom(!isNearBottom);
  };

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4 relative"
    >
      {/* Intro Banner for the Character */}
      <div className={`text-center py-6 border-b space-y-2 max-w-md mx-auto ${
        isDark ? 'border-zinc-800/80' : 'border-zinc-200'
      }`}>
        {character.avatar ? (
          <img
            src={character.avatar}
            alt={character.name}
            className="w-14 h-14 rounded-full mx-auto object-cover border border-zinc-700"
          />
        ) : (
          <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center font-bold text-base ${
            isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-700'
          }`}>
            <Bot className="w-6 h-6" />
          </div>
        )}
        <h3 className="text-base font-semibold">{character.name}</h3>
        <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {character.description || character.tagline}
        </p>
      </div>

      {/* Message List */}
      {messages.map((msg) => (
        <ChatMessageItem
          key={msg.id}
          message={msg}
          character={character}
          persona={persona}
          onReroll={onReroll}
          onEdit={onEdit}
          onDelete={onDelete}
          onSwipeChange={onSwipeChange}
          isLastAssistantMessage={lastAssistantMessage?.id === msg.id}
        />
      ))}

      {/* Streaming Active Bubble */}
      {isGenerating && activeStreamingMessage && (() => {
        const { cleanText: cleanStreamingText, moodInfo: streamingMoodInfo } = extractMoodFromText(activeStreamingMessage);
        return (
          <div className={`flex gap-3 p-3 sm:p-4 rounded-xl border mr-3 sm:mr-10 ${
            isDark ? 'bg-zinc-950 border-zinc-700' : 'bg-white border-zinc-300 shadow-sm'
          }`}>
            <div className="shrink-0 pt-0.5">
              {character.avatar ? (
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
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold">{character.name}</span>
                {streamingMoodInfo && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide shadow-sm animate-fade-in ${streamingMoodInfo.badgeClass}`}
                  >
                    <span>{streamingMoodInfo.emoji}</span>
                    <span className="capitalize">{streamingMoodInfo.label}</span>
                  </span>
                )}
                <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Mengetik...</span>
              </div>
              <div>
                <ChatMessageFormatter content={cleanStreamingText} />
                <span className="streaming-cursor" />
              </div>
            </div>
          </div>
        );
      })()}

      <div ref={bottomRef} className="h-2" />

      {/* Scroll to bottom button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className={`fixed bottom-24 right-6 md:right-10 p-2.5 rounded-full shadow-lg border transition-all cursor-pointer z-30 ${
            isDark ? 'bg-zinc-100 text-zinc-950 border-white hover:bg-white' : 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800'
          }`}
          title="Scroll ke bawah"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

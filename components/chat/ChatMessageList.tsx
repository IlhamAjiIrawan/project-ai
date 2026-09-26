'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Character, ChatMessage, UserPersona } from '@/types';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatMessageFormatter } from './ChatMessageFormatter';
import { useAppStore } from '@/lib/store';
import { ArrowDown, Bot, Sparkles } from 'lucide-react';

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
  const { isGenerating, activeStreamingMessage } = useAppStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // Auto scroll on message update or streaming
  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom(true);
    }
  }, [messages, activeStreamingMessage, isGenerating, showScrollBottom]);

  // Handle scroll detection
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
      className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative"
    >
      {/* Intro Banner for the Character */}
      <div className="text-center py-6 border-b border-white/5 space-y-2 max-w-lg mx-auto">
        {character.avatar ? (
          <img
            src={character.avatar}
            alt={character.name}
            className="w-16 h-16 rounded-2xl mx-auto object-cover ring-2 ring-purple-500/40 shadow-xl"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl mx-auto bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg ring-2 ring-purple-500/40 shadow-xl">
            <Bot className="w-8 h-8" />
          </div>
        )}
        <h3 className="text-lg font-bold text-white">{character.name}</h3>
        <p className="text-xs text-zinc-400 font-light">{character.description || character.tagline}</p>
        <div className="flex flex-wrap justify-center gap-1.5 pt-1">
          {character.tags.map((tag, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-zinc-400">
              #{tag}
            </span>
          ))}
        </div>
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
      {isGenerating && activeStreamingMessage && (
        <div className="flex gap-3.5 p-3 md:p-4 rounded-2xl bg-zinc-950/70 border border-cyan-500/30 mr-4 sm:mr-12 animate-in fade-in duration-150">
          <div className="shrink-0 pt-0.5">
            {character.avatar ? (
              <img
                src={character.avatar}
                alt={character.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-cyan-500/50"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs ring-2 ring-cyan-500/50">
                <Bot className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-300">{character.name}</span>
              <span className="text-[10px] text-cyan-400 font-mono animate-pulse">Mengetik...</span>
            </div>
            <div>
              <ChatMessageFormatter content={activeStreamingMessage} />
              <span className="streaming-cursor" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-2" />

      {/* Scroll to bottom button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="fixed bottom-24 right-6 md:right-10 p-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-xl shadow-cyan-500/30 transition-all cursor-pointer z-30"
          title="Scroll ke bawah"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

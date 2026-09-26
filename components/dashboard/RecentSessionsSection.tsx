'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, MessageSquare } from 'lucide-react';
import { Character, ChatSession } from '@/types';
import { formatDate } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

interface RecentSessionsSectionProps {
  sessions: ChatSession[];
  characters: Character[];
}

export function RecentSessionsSection({ sessions, characters }: RecentSessionsSectionProps) {
  const router = useRouter();
  const { setSelectedSessionId, setSelectedCharacterId, theme } = useAppStore();
  const isDark = theme === 'dark';

  if (sessions.length === 0) return null;

  const handleResumeSession = (sessionId: string, characterId: string) => {
    setSelectedSessionId(sessionId);
    setSelectedCharacterId(characterId);
    router.push('/chat');
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold">Lanjutkan Obrolan</h2>
        </div>
        <Link
          href="/chat"
          className={`text-xs flex items-center gap-1 font-medium transition-colors ${
            isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <span>Semua Sesi</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sessions.slice(0, 3).map((session) => {
          const char = characters.find((c) => c.id === session.characterId);
          return (
            <div
              key={session.id}
              onClick={() => handleResumeSession(session.id, session.characterId)}
              className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer border transition-colors ${
                isDark
                  ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 shadow-sm'
              }`}
            >
              {char?.avatar ? (
                <img
                  src={char.avatar}
                  alt={char?.name || 'Character'}
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
                }`}>
                  {(char?.name || session.title).charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-semibold text-xs truncate">
                    {char?.name || session.title}
                  </p>
                  <span className={`text-[10px] shrink-0 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {formatDate(session.updatedAt)}
                  </span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {session.lastMessagePreview || 'Lanjutkan obrolan...'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

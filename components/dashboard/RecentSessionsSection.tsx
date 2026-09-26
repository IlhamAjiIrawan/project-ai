'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Flame, ChevronRight, Bot } from 'lucide-react';
import { Character, ChatSession } from '@/types';
import { formatDate } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

interface RecentSessionsSectionProps {
  sessions: ChatSession[];
  characters: Character[];
}

export function RecentSessionsSection({ sessions, characters }: RecentSessionsSectionProps) {
  const router = useRouter();
  const { setSelectedSessionId, setSelectedCharacterId } = useAppStore();

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
          <Flame className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm sm:text-base font-bold text-white">Lanjutkan Cerita Terakhir</h2>
        </div>
        <Link
          href="/chat"
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
        >
          <span>Lihat Semua Sesi</span>
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
              className="group glass-card p-3 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-cyan-500/40 transition-all border border-white/5"
            >
              {char?.avatar ? (
                <img
                  src={char.avatar}
                  alt={char?.name || 'Character'}
                  className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10 shrink-0 group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold ring-1 ring-white/10 shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-semibold text-xs text-white truncate group-hover:text-cyan-300">
                    {char?.name || session.title}
                  </p>
                  <span className="text-[10px] text-zinc-400 shrink-0">{formatDate(session.updatedAt)}</span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
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

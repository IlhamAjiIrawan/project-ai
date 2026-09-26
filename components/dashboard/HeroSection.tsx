'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface HeroSectionProps {
  charactersCount: number;
  sessionsCount: number;
  personasCount: number;
}

export function HeroSection({
  charactersCount,
  sessionsCount,
  personasCount,
}: HeroSectionProps) {
  const { setIsCharacterModalOpen, setEditingCharacter, theme } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <div className={`rounded-2xl p-6 md:p-8 border transition-colors ${
      isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Roleplay AI Studio
          </h1>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Jelajahi berbagai karakter cerita interaktif atau rancang karakter baru dengan kepribadian kustom, skenario, dan lorebook.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setEditingCharacter(null);
              setIsCharacterModalOpen(true);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-colors cursor-pointer ${
              isDark
                ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
                : 'bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Buat Karakter</span>
          </button>

          <Link
            href="/chat"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-xs sm:text-sm transition-colors cursor-pointer ${
              isDark
                ? 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800'
                : 'border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-zinc-400" />
            <span>Ruang Chat</span>
          </Link>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className={`grid grid-cols-3 gap-4 pt-6 mt-6 border-t ${isDark ? 'border-zinc-800/80' : 'border-zinc-100'}`}>
        <div>
          <p className="text-lg sm:text-xl font-bold">{charactersCount}</p>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Karakter Tersedia</p>
        </div>

        <div>
          <p className="text-lg sm:text-xl font-bold">{sessionsCount}</p>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Sesi Obrolan</p>
        </div>

        <div>
          <p className="text-lg sm:text-xl font-bold">{personasCount}</p>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Persona Pemain</p>
        </div>
      </div>
    </div>
  );
}

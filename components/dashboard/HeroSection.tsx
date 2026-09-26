'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Plus, MessageSquare, Compass, Users, Zap } from 'lucide-react';
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
  const { setIsCharacterModalOpen, setEditingCharacter } = useAppStore();

  return (
    <div className="relative rounded-3xl p-6 md:p-8 overflow-hidden border border-white/10 glass-panel shadow-xl">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-72 h-72 rounded-full bg-gradient-to-br from-cyan-500/15 via-violet-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-16 w-52 h-52 rounded-full bg-gradient-to-tr from-fuchsia-500/10 to-transparent blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Studio Interaktif AI Roleplay</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Eksplorasi Dunia &{' '}
            <span className="shimmer-text">Karakter AI</span>
          </h1>

          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-xl">
            Pilih karakter favoritmu untuk memulai cerita novel interaktif atau buat karakter kustom dengan prompt, skenario, dan lorebook khusus.
          </p>
        </div>

        {/* Quick Stats & Primary Action */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setEditingCharacter(null);
              setIsCharacterModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-xs md:text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Karakter</span>
          </button>

          <Link
            href="/chat"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-white/10 font-medium text-xs md:text-sm transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Buka Ruang Chat</span>
          </Link>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/5">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{charactersCount}</p>
            <p className="text-[10px] text-zinc-400">Total Karakter</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{sessionsCount}</p>
            <p className="text-[10px] text-zinc-400">Sesi Tersimpan</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">{personasCount}</p>
            <p className="text-[10px] text-zinc-400">Persona Pemain</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Multi-LLM</p>
            <p className="text-[10px] text-zinc-400">Gemini, Groq, OpenRouter</p>
          </div>
        </div>
      </div>
    </div>
  );
}

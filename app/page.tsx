'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CharacterCard } from '@/components/CharacterCard';
import { useAppStore } from '@/lib/store';
import {
  Search,
  Plus,
  Compass,
  Sparkles,
  MessageSquare,
  Users,
  Flame,
  SlidersHorizontal,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const CATEGORIES = [
  { id: 'all', label: 'Semua Kategori' },
  { id: 'scifi', label: 'Sci-Fi / Cyberpunk' },
  { id: 'fantasy', label: 'High Fantasy' },
  { id: 'anime', label: 'Anime & Romance' },
  { id: 'mystery', label: 'Misteri & Detektif' },
  { id: 'rpg', label: 'RPG Game Master' },
  { id: 'assistant', label: 'Asisten Khusus' },
];

export default function DashboardPage() {
  const router = useRouter();
  const {
    setSelectedCharacterId,
    setSelectedSessionId,
    setIsCharacterModalOpen,
    setEditingCharacter,
  } = useAppStore();

  const characters = useLiveQuery(() => db.characters.toArray(), []) || [];
  const sessions = useLiveQuery(() => db.chatSessions.orderBy('updatedAt').reverse().toArray(), []) || [];
  const personas = useLiveQuery(() => db.personas.toArray(), []) || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredCharacters = characters.filter((char) => {
    const matchesCategory = selectedCategory === 'all' || char.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const handleResumeSession = (sessionId: string, characterId: string) => {
    setSelectedSessionId(sessionId);
    setSelectedCharacterId(characterId);
    router.push('/chat');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-7 max-w-7xl mx-auto w-full">
      {/* Sleek Minimalist Hero / Header */}
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
              <p className="text-xs font-semibold text-white">{characters.length}</p>
              <p className="text-[10px] text-zinc-400">Total Karakter</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{sessions.length}</p>
              <p className="text-[10px] text-zinc-400">Sesi Tersimpan</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{personas.length}</p>
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

      {/* Continue Last Stories (Recent Sessions) */}
      {sessions.length > 0 && (
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
                  <img
                    src={char?.avatar || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100'}
                    alt={char?.name || 'Character'}
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10 shrink-0 group-hover:scale-105 transition-transform"
                  />
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
      )}

      {/* Search & Category Filter Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama karakter, tag, tema..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-xs sm:text-sm placeholder:text-zinc-500 focus:outline-none"
            />
          </div>

          <div className="text-xs text-zinc-400 self-end sm:self-center">
            Menampilkan <span className="font-semibold text-white">{filteredCharacters.length}</span> karakter
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-white/5'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Character Grid */}
      <section>
        {filteredCharacters.length === 0 ? (
          <div className="text-center py-16 space-y-3 rounded-3xl border border-white/5 bg-zinc-950/40 p-8">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-500">
              <Compass className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-zinc-300">Tidak ada karakter yang cocok dengan pencarianmu.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs text-cyan-400 hover:underline cursor-pointer"
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredCharacters.map((char) => (
              <CharacterCard key={char.id} character={char} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

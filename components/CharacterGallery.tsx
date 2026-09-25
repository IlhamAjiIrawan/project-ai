'use client';

import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CharacterCard } from './CharacterCard';
import { useAppStore } from '@/lib/store';
import {
  Search,
  Plus,
  Upload,
  Compass,
  Sparkles,
  Flame,
  Filter,
  Layers,
} from 'lucide-react';
import { readJsonFile } from '@/lib/utils';
import { Character } from '@/types';

const CATEGORIES = [
  { id: 'all', label: 'Semua Kategori' },
  { id: 'scifi', label: 'Sci-Fi / Cyberpunk' },
  { id: 'fantasy', label: 'High Fantasy' },
  { id: 'anime', label: 'Anime & Romance' },
  { id: 'mystery', label: 'Misteri & Detektif' },
  { id: 'rpg', label: 'RPG Game Master' },
  { id: 'assistant', label: 'Asisten Khusus' },
];

export function CharacterGallery() {
  const { setEditingCharacter, setIsCharacterModalOpen } = useAppStore();
  const characters = useLiveQuery(() => db.characters.toArray(), []) || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await readJsonFile<Partial<Character>>(file);
      if (!parsedData.name || !parsedData.greetingMessage) {
        alert('File karakter tidak memiliki format yang valid (Nama dan Greeting Message wajib ada).');
        return;
      }

      const newChar: Character = {
        id: `char_${Date.now()}_custom`,
        name: parsedData.name,
        avatar:
          parsedData.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        tagline: parsedData.tagline || 'Karakter Kustom',
        description: parsedData.description || '',
        systemPrompt: parsedData.systemPrompt || '',
        greetingMessage: parsedData.greetingMessage,
        scenario: parsedData.scenario || '',
        exampleDialogue: parsedData.exampleDialogue || '',
        tags: parsedData.tags || ['Custom'],
        category: (parsedData.category as any) || 'custom',
        lorebook: parsedData.lorebook || [],
        isCustom: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.characters.put(newChar);
      alert(`Karakter "${newChar.name}" berhasil diimpor!`);
    } catch (err: any) {
      alert(`Gagal mengimpor file: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Hero Banner */}
      <div className="relative rounded-3xl p-6 md:p-10 overflow-hidden border border-white/10 glass-panel shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-gradient-to-br from-cyan-500/20 via-violet-500/15 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-gradient-to-tr from-fuchsia-500/15 to-transparent blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Studio Interaktif AI Roleplay</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Eksplorasi & Berinteraksi dengan{' '}
            <span className="shimmer-text">Karakter Tanpa Batas</span>
          </h1>

          <p className="text-zinc-300 text-sm md:text-base font-light leading-relaxed">
            Pilih karakter fiksi favoritmu atau buat persona kustom baru. Didukung oleh integrasi multi-model AI cerdas (Google Gemini, OpenRouter, Groq, & Claude) dengan format novel interaktif yang imersif.
          </p>

          {/* Quick CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => {
                setEditingCharacter(null);
                setIsCharacterModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-xs md:text-sm shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Karakter Baru</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-white/10 font-medium text-xs md:text-sm transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Impor Karakter (JSON)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Search & Category Filter Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari karakter, tag, atau tema petualangan..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-xs sm:text-sm placeholder:text-zinc-500 focus:outline-none"
            />
          </div>

          <div className="text-xs text-zinc-400 self-end md:self-center">
            Menampilkan <span className="font-semibold text-white">{filteredCharacters.length}</span> karakter
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-white/5'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Character Grid */}
      {filteredCharacters.length === 0 ? (
        <div className="text-center py-16 space-y-4 rounded-3xl border border-white/5 bg-zinc-950/40 p-8">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-500">
            <Compass className="w-6 h-6" />
          </div>
          <p className="text-base font-medium text-zinc-300">Tidak ada karakter yang cocok dengan pencarianmu.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="text-xs text-cyan-400 hover:underline cursor-pointer"
          >
            Reset Filter & Pencarian
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredCharacters.map((char) => (
            <CharacterCard key={char.id} character={char} />
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CharacterCard } from '@/components/CharacterCard';
import { useAppStore } from '@/lib/store';
import {
  Sparkles,
  Plus,
  Upload,
  Download,
  Search,
  BookOpen,
  Bot,
  Filter,
  Layers,
  Compass,
} from 'lucide-react';
import { downloadJson, readJsonFile } from '@/lib/utils';
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

export default function CharactersStudioPage() {
  const { setEditingCharacter, setIsCharacterModalOpen } = useAppStore();
  const characters = useLiveQuery(() => db.characters.toArray(), []) || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'custom' | 'preset'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCharacters = characters.filter((char) => {
    const matchesCategory = selectedCategory === 'all' || char.category === selectedCategory;
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'custom' && Boolean(char.isCustom)) ||
      (typeFilter === 'preset' && !char.isCustom);
    const matchesSearch =
      searchQuery === '' ||
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesType && matchesSearch;
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

  const handleExportAll = () => {
    if (characters.length === 0) return;
    downloadJson(`all_characters_backup_${Date.now()}.json`, {
      version: 1,
      exportedAt: new Date().toISOString(),
      characters,
    });
  };

  const customCount = characters.filter((c) => c.isCustom).length;
  const presetCount = characters.filter((c) => !c.isCustom).length;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-7 max-w-7xl mx-auto w-full">
      {/* Studio Header Banner */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Studio & Lorebook Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Studio Karakter AI
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Buat, kustomisasi prompt kepribadian, lorebook memori dunia, dan format percakapan karakter AI favoritmu.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setEditingCharacter(null);
                setIsCharacterModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-xs md:text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Karakter Baru</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs md:text-sm font-medium transition-all cursor-pointer"
              title="Impor Karakter dari file JSON (SillyTavern/TavernAI format)"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Impor JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />

            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs md:text-sm font-medium transition-all cursor-pointer"
              title="Ekspor Semua Karakter sebagai Backup JSON"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Ekspor Semua</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Custom vs Preset Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/70 border border-white/5 w-full md:w-auto">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Semua ({characters.length})
            </button>
            <button
              onClick={() => setTypeFilter('custom')}
              className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                typeFilter === 'custom'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Kustom ({customCount})
            </button>
            <button
              onClick={() => setTypeFilter('preset')}
              className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                typeFilter === 'preset'
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Preset Bawaan ({presetCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari karakter atau tag..."
              className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
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
      </div>

      {/* Characters Grid */}
      <div>
        {filteredCharacters.length === 0 ? (
          <div className="text-center py-16 space-y-3 rounded-3xl border border-white/5 bg-zinc-950/40 p-8">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-500">
              <Compass className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-zinc-300">Tidak ada karakter yang sesuai.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setTypeFilter('all');
              }}
              className="text-xs text-cyan-400 hover:underline cursor-pointer"
            >
              Reset Filter
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
    </div>
  );
}

'use client';

import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { CharacterCard } from '@/components/CharacterCard';
import { useAppStore } from '@/lib/store';
import {
  Plus,
  Upload,
  Download,
  Search,
  Compass,
} from 'lucide-react';
import { downloadJson, readJsonFile } from '@/lib/utils';
import { Character } from '@/types';

const CATEGORIES = [
  { id: 'all', label: 'Semua Kategori' },
  { id: 'scifi', label: 'Sci-Fi' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'anime', label: 'Anime' },
  { id: 'mystery', label: 'Misteri' },
  { id: 'rpg', label: 'RPG' },
  { id: 'assistant', label: 'Asisten' },
];

export default function CharactersStudioPage() {
  const { setEditingCharacter, setIsCharacterModalOpen, theme } = useAppStore();
  const characters = useLiveQuery(() => db.characters.toArray(), []) || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'custom' | 'preset'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';

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
        alert('Format file tidak valid (Nama & Greeting Message wajib ada).');
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
    downloadJson(`characters_backup_${Date.now()}.json`, {
      version: 1,
      exportedAt: new Date().toISOString(),
      characters,
    });
  };

  const customCount = characters.filter((c) => c.isCustom).length;
  const presetCount = characters.filter((c) => !c.isCustom).length;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className={`rounded-2xl p-6 border transition-colors ${
        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Studio Karakter
            </h1>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Buat, kustomisasi prompt, lorebook, dan kelola koleksi karakter roleplay.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setEditingCharacter(null);
                setIsCharacterModalOpen(true);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                isDark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Karakter Baru</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
              }`}
              title="Impor Karakter dari file JSON"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
              <span>Impor</span>
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
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
              }`}
              title="Ekspor Semua Karakter sebagai JSON"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Ekspor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Custom vs Preset Pills */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${
            isDark ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === 'all'
                  ? isDark ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'bg-white text-zinc-900 font-semibold shadow-sm'
                  : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Semua ({characters.length})
            </button>
            <button
              onClick={() => setTypeFilter('custom')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === 'custom'
                  ? isDark ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'bg-white text-zinc-900 font-semibold shadow-sm'
                  : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Kustom ({customCount})
            </button>
            <button
              onClick={() => setTypeFilter('preset')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === 'preset'
                  ? isDark ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'bg-white text-zinc-900 font-semibold shadow-sm'
                  : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Preset ({presetCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari karakter atau tag..."
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border transition-colors ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500'
                  : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 shadow-sm'
              }`}
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                  isActive
                    ? isDark ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold' : 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                    : isDark ? 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200' : 'bg-white text-zinc-600 border-zinc-200 hover:text-zinc-900 shadow-sm'
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
          <div className={`text-center py-16 space-y-3 rounded-2xl border p-8 ${
            isDark ? 'border-zinc-800/80 bg-zinc-900/20 text-zinc-400' : 'border-zinc-200 bg-white/60 text-zinc-600 shadow-sm'
          }`}>
            <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center ${
              isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
            }`}>
              <Compass className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium">Tidak ada karakter yang cocok.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setTypeFilter('all');
              }}
              className="text-xs font-medium hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCharacters.map((char) => (
              <CharacterCard key={char.id} character={char} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Search } from 'lucide-react';

export const CATEGORIES = [
  { id: 'all', label: 'Semua Kategori' },
  { id: 'scifi', label: 'Sci-Fi / Cyberpunk' },
  { id: 'fantasy', label: 'High Fantasy' },
  { id: 'anime', label: 'Anime & Romance' },
  { id: 'mystery', label: 'Misteri & Detektif' },
  { id: 'rpg', label: 'RPG Game Master' },
  { id: 'assistant', label: 'Asisten Khusus' },
];

interface CategoryFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  totalResultsCount: number;
}

export function CategoryFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  totalResultsCount,
}: CategoryFilterBarProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80 md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama karakter, tag, tema..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-xs sm:text-sm placeholder:text-zinc-500 focus:outline-none"
          />
        </div>

        <div className="text-xs text-zinc-400 self-end sm:self-center">
          Menampilkan <span className="font-semibold text-white">{totalResultsCount}</span> karakter
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
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
  );
}

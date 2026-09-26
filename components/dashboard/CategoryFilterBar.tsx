'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export const CATEGORIES = [
  { id: 'all', label: 'Semua' },
  { id: 'scifi', label: 'Sci-Fi' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'anime', label: 'Anime' },
  { id: 'mystery', label: 'Misteri' },
  { id: 'rpg', label: 'RPG' },
  { id: 'assistant', label: 'Asisten' },
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
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  return (
    <section className="space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari karakter..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs sm:text-sm border transition-colors ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600'
                : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 shadow-sm'
            }`}
          />
        </div>

        <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          <span>{totalResultsCount}</span> karakter
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                isActive
                  ? isDark
                    ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold'
                    : 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                  : isDark
                    ? 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:bg-zinc-800'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:bg-zinc-100 shadow-sm'
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

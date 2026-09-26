'use client';

import React from 'react';
import { Compass } from 'lucide-react';
import { Character } from '@/types';
import { CharacterCard } from '@/components/CharacterCard';
import { useAppStore } from '@/lib/store';

interface CharacterGridProps {
  characters: Character[];
  onResetFilters: () => void;
}

export function CharacterGrid({ characters, onResetFilters }: CharacterGridProps) {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  if (characters.length === 0) {
    return (
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
          onClick={onResetFilters}
          className={`text-xs font-medium hover:underline cursor-pointer ${
            isDark ? 'text-zinc-300' : 'text-zinc-800'
          }`}
        >
          Reset Pencarian
        </button>
      </div>
    );
  }

  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {characters.map((char) => (
          <CharacterCard key={char.id} character={char} />
        ))}
      </div>
    </section>
  );
}

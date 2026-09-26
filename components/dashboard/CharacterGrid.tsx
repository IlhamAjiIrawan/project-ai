'use client';

import React from 'react';
import { Compass } from 'lucide-react';
import { Character } from '@/types';
import { CharacterCard } from '@/components/CharacterCard';

interface CharacterGridProps {
  characters: Character[];
  onResetFilters: () => void;
}

export function CharacterGrid({ characters, onResetFilters }: CharacterGridProps) {
  if (characters.length === 0) {
    return (
      <div className="text-center py-16 space-y-3 rounded-3xl border border-white/5 bg-zinc-950/40 p-8">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-500">
          <Compass className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-zinc-300">Tidak ada karakter yang cocok dengan pencarianmu.</p>
        <button
          onClick={onResetFilters}
          className="text-xs text-cyan-400 hover:underline cursor-pointer font-medium"
        >
          Reset Pencarian & Filter
        </button>
      </div>
    );
  }

  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {characters.map((char) => (
          <CharacterCard key={char.id} character={char} />
        ))}
      </div>
    </section>
  );
}

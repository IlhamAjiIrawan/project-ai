'use client';

import React from 'react';
import { Character, UserPersona } from '@/types';
import { useAppStore } from '@/lib/store';
import { X, BookOpen, User, Bot, Sparkles, Sliders, MapPin } from 'lucide-react';

interface ScenarioDrawerProps {
  character: Character;
  persona?: UserPersona;
}

export function ScenarioDrawer({ character, persona }: ScenarioDrawerProps) {
  const { isScenarioDrawerOpen, setIsScenarioDrawerOpen, setEditingCharacter, setIsCharacterModalOpen } = useAppStore();

  if (!isScenarioDrawerOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 glass-panel border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-sm text-white">Skenario & Pengetahuan Dunia</h3>
        </div>
        <button
          onClick={() => setIsScenarioDrawerOpen(false)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Character Card Info */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-2">
          <div className="flex items-center gap-3">
            <img
              src={character.avatar}
              alt={character.name}
              className="w-12 h-12 rounded-xl object-cover ring-1 ring-purple-500/40"
            />
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-white truncate">{character.name}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
                {character.category.toUpperCase()}
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">{character.description || character.tagline}</p>
        </div>

        {/* Current Scenario & Setting */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
            <MapPin className="w-3.5 h-3.5" />
            <span>Latar & Skenario Saat Ini</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/5 text-xs text-zinc-300 leading-relaxed font-sans">
            {character.scenario || 'Tidak ada skenario latar spesifik yang diatur.'}
          </div>
        </div>

        {/* Active Player Persona */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
            <User className="w-3.5 h-3.5" />
            <span>Persona Pemain (User)</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-900/40 border border-white/5 space-y-1 text-xs">
            <p className="font-bold text-white">{persona?.name || 'User Tanpa Nama'}</p>
            <p className="text-zinc-400 leading-relaxed">{persona?.bio || 'Petualang misterius tanpa latar belakang.'}</p>
          </div>
        </div>

        {/* Lorebook Entries */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400">
            <span>Memori Lorebook ({character.lorebook?.length || 0})</span>
          </div>

          {(!character.lorebook || character.lorebook.length === 0) ? (
            <p className="text-xs text-zinc-500 italic">Belum ada memori Lorebook khusus untuk karakter ini.</p>
          ) : (
            <div className="space-y-2">
              {character.lorebook.map((entry, i) => (
                <div key={entry.id || i} className="p-2.5 rounded-xl bg-zinc-900/50 border border-white/5 space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {entry.keys.map((k, kIdx) => (
                      <span key={kIdx} className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 font-mono">
                        #{k}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">{entry.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Character shortcut */}
        <div className="pt-2">
          <button
            onClick={() => {
              setEditingCharacter(character);
              setIsCharacterModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Edit Data Karakter di Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Character, UserPersona } from '@/types';
import { useAppStore } from '@/lib/store';
import { X, BookOpen, User, Bot, MapPin, Sliders } from 'lucide-react';

interface ScenarioDrawerProps {
  character: Character;
  persona?: UserPersona;
}

export function ScenarioDrawer({ character, persona }: ScenarioDrawerProps) {
  const { isScenarioDrawerOpen, setIsScenarioDrawerOpen, setEditingCharacter, setIsCharacterModalOpen, theme } = useAppStore();
  const isDark = theme === 'dark';

  if (!isScenarioDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div
        className="absolute inset-0"
        onClick={() => setIsScenarioDrawerOpen(false)}
      />

      <div className={`relative z-10 w-full sm:w-80 h-full border-l flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 transition-colors ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-zinc-400" />
            <h3 className="font-semibold text-xs sm:text-sm">Skenario & Pengetahuan</h3>
          </div>
          <button
            onClick={() => setIsScenarioDrawerOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Character Card Info */}
          <div className={`p-3 rounded-xl border space-y-2 ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {character.avatar ? (
                <img
                  src={character.avatar}
                  alt={character.name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                  isDark ? 'bg-zinc-800' : 'bg-zinc-200'
                }`}>
                  <Bot className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <h4 className="font-semibold truncate">{character.name}</h4>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium uppercase tracking-wider ${
                  isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600'
                }`}>
                  {character.category}
                </span>
              </div>
            </div>
            <p className={`leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {character.description || character.tagline}
            </p>
          </div>

          {/* Current Scenario */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 font-semibold text-zinc-400">
              <MapPin className="w-3.5 h-3.5" />
              <span>Skenario Latar</span>
            </div>
            <div className={`p-2.5 rounded-xl border leading-relaxed ${
              isDark ? 'bg-zinc-900/40 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
            }`}>
              {character.scenario || 'Tidak ada skenario spesifik yang diatur.'}
            </div>
          </div>

          {/* Active Player Persona */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 font-semibold text-zinc-400">
              <User className="w-3.5 h-3.5" />
              <span>Persona Pemain</span>
            </div>
            <div className={`p-2.5 rounded-xl border space-y-1 ${
              isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <p className="font-semibold">{persona?.name || 'User'}</p>
              <p className={`leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {persona?.bio || 'Petualang misterius tanpa bio.'}
              </p>
            </div>
          </div>

          {/* Lorebook Entries */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-zinc-400">
              <span>Memori Lorebook ({character.lorebook?.length || 0})</span>
            </div>

            {(!character.lorebook || character.lorebook.length === 0) ? (
              <p className={`italic ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Belum ada memori lorebook.
              </p>
            ) : (
              <div className="space-y-2">
                {character.lorebook.map((entry, i) => (
                  <div key={entry.id || i} className={`p-2 rounded-lg border space-y-1 ${
                    isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <div className="flex flex-wrap gap-1">
                      {entry.keys.map((k, kIdx) => (
                        <span key={kIdx} className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                          isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-700'
                        }`}>
                          #{k}
                        </span>
                      ))}
                    </div>
                    <p className={`leading-snug ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{entry.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit Character shortcut */}
          <div className="pt-2">
            <button
              onClick={() => {
                setIsScenarioDrawerOpen(false);
                setEditingCharacter(character);
                setIsCharacterModalOpen(true);
              }}
              className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit Karakter di Studio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

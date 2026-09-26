'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/db';
import { Character, MemoryCategory, SessionMemory } from '@/types';
import { X, Brain, Calendar, Heart, ShieldAlert, Lock, FileText, Check, Plus } from 'lucide-react';

interface PinMemoryModalProps {
  character: Character;
}

const CATEGORIES: Array<{ id: MemoryCategory; label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = [
  { id: 'event', label: 'Peristiwa Penting', icon: Calendar, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  { id: 'relation', label: 'Dinamika Hubungan', icon: Heart, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { id: 'promise', label: 'Janji / Kesepakatan', icon: ShieldAlert, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { id: 'secret', label: 'Rahasia / Fakta Tersembunyi', icon: Lock, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { id: 'fact', label: 'Fakta Baru', icon: FileText, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
];

export function PinMemoryModal({ character }: PinMemoryModalProps) {
  const { pinMemoryModalData, setPinMemoryModalData, selectedSessionId, theme } = useAppStore();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<MemoryCategory>('event');
  const [isSaved, setIsSaved] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (pinMemoryModalData) {
      // Clean asterisks or narrative tags for a cleaner initial memory summary
      const cleanSnippet = pinMemoryModalData.messageContent
        .replace(/\n+/g, ' ')
        .trim();
      setContent(cleanSnippet);
      setCategory('event');
      setIsSaved(false);
    }
  }, [pinMemoryModalData]);

  if (!pinMemoryModalData) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || !content.trim()) return;

    const newMem: SessionMemory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId: selectedSessionId,
      characterId: character.id,
      content: content.trim(),
      category,
      enabled: true,
      timestamp: Date.now(),
    };

    await db.sessionMemories.put(newMem);
    setIsSaved(true);
    setTimeout(() => {
      setPinMemoryModalData(null);
      setIsSaved(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`relative w-full max-w-lg rounded-2xl flex flex-col overflow-hidden shadow-2xl border transition-colors ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isDark ? 'border-zinc-800' : 'border-zinc-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-zinc-900 text-zinc-200' : 'bg-zinc-100 text-zinc-800'}`}>
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Simpan ke Memori Karakter</h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {character.name} akan selalu mengingat peristiwa ini
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPinMemoryModalData(null)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4">
          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Kategori Memori</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2 rounded-xl text-left border text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? cat.color + ' font-semibold'
                        : isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Memory Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Isi Catatan Memori / Peristiwa</label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan peristiwa atau fakta yang ingin diingat..."
              className={`w-full p-3 rounded-xl text-xs sm:text-sm border resize-none leading-relaxed ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500' : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
              }`}
            />
            <p className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Tips: Tuliskan secara ringkas dalam 1–2 kalimat fakta atau peristiwa yang jelas.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPinMemoryModalData(null)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!content.trim() || isSaved}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-emerald-600 text-white'
                  : content.trim()
                  ? isDark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  : 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Simpan ke Memori</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { Character, UserPersona } from '@/types';
import { useAppStore } from '@/lib/store';
import {
  Compass,
  Sliders,
  Download,
  Trash2,
  BookOpen,
  User,
  Sparkles,
  Bot,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { downloadJson } from '@/lib/utils';
import { db } from '@/lib/db';

interface ChatHeaderProps {
  character: Character;
  persona?: UserPersona;
  onClearSession: () => void;
}

export function ChatHeader({ character, persona, onClearSession }: ChatHeaderProps) {
  const {
    setActiveView,
    isScenarioDrawerOpen,
    setIsScenarioDrawerOpen,
    setIsSettingsOpen,
    setIsPersonaModalOpen,
    selectedSessionId,
    settings,
  } = useAppStore();

  const activeProvider = character.customProvider || settings.defaultProvider;
  const activeModel = character.customModel || settings.defaultModel;

  const handleExportChat = async () => {
    if (!selectedSessionId) return;
    const messages = await db.chatMessages.where('sessionId').equals(selectedSessionId).sortBy('timestamp');

    const formattedLog = messages
      .map((m) => {
        const sender = m.role === 'assistant' ? character.name : persona?.name || 'User';
        return `[${new Date(m.timestamp).toLocaleTimeString()}] ${sender}:\n${m.content}\n`;
      })
      .join('\n---\n\n');

    const blob = new Blob([formattedLog], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${character.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel border-b border-white/10 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
      {/* Left: Character Info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setActiveView('gallery')}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 md:hidden cursor-pointer shrink-0"
          title="Kembali ke Galeri"
        >
          <Compass className="w-5 h-5" />
        </button>

        <div className="relative shrink-0">
          <img
            src={character.avatar}
            alt={character.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-500/30"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-950" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm sm:text-base text-white truncate">{character.name}</h2>
            <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-cyan-300 font-mono border border-white/5">
              {activeModel}
            </span>
          </div>
          <p className="text-xs text-zinc-400 truncate max-w-md hidden sm:block">
            {character.tagline || character.description}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Active Persona Badge */}
        <button
          onClick={() => setIsPersonaModalOpen(true)}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-white/10 text-xs cursor-pointer transition-colors"
          title="Bermain sebagai"
        >
          <User className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] text-zinc-400">Pemain:</span>
          <span className="font-semibold text-zinc-200">{persona?.name || 'Persona'}</span>
        </button>

        {/* Toggle Scenario Drawer */}
        <button
          onClick={() => setIsScenarioDrawerOpen(!isScenarioDrawerOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
            isScenarioDrawerOpen
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-zinc-900/60 text-zinc-400 hover:text-white border-white/10'
          }`}
          title="Lihat Skenario & Lorebook"
        >
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span className="hidden md:inline">Skenario & Info</span>
        </button>

        {/* Export Chat */}
        <button
          onClick={handleExportChat}
          className="p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
          title="Ekspor Riwayat Chat (.txt)"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Clear Session */}
        <button
          onClick={onClearSession}
          className="p-2 rounded-xl bg-zinc-900/60 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
          title="Hapus & Mulai Ulang Sesi Chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

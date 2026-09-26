'use client';

import React, { useState } from 'react';
import { Character, UserPersona } from '@/types';
import { useAppStore } from '@/lib/store';
import {
  Compass,
  Download,
  Trash2,
  BookOpen,
  User,
  Bot,
  Search,
  X,
  FileText,
  FileCode,
  Check,
} from 'lucide-react';
import { downloadJson } from '@/lib/utils';
import { db } from '@/lib/db';
import Link from 'next/link';

interface ChatHeaderProps {
  character: Character;
  persona?: UserPersona;
  onClearSession: () => void;
  searchKeyword?: string;
  onSearchChange?: (keyword: string) => void;
  isSearchOpen?: boolean;
  onToggleSearch?: () => void;
}

export function ChatHeader({
  character,
  persona,
  onClearSession,
  searchKeyword = '',
  onSearchChange,
  isSearchOpen = false,
  onToggleSearch,
}: ChatHeaderProps) {
  const {
    isScenarioDrawerOpen,
    setIsScenarioDrawerOpen,
    setIsPersonaModalOpen,
    selectedSessionId,
    settings,
  } = useAppStore();

  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const activeModel = character.customModel || settings.defaultModel;

  const showNotification = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const handleExportText = async () => {
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
    setExportDropdownOpen(false);
    showNotification('Obrolan diekspor sebagai .txt');
  };

  const handleExportMarkdown = async () => {
    if (!selectedSessionId) return;
    const messages = await db.chatMessages.where('sessionId').equals(selectedSessionId).sortBy('timestamp');

    const mdContent = [
      `# 🎭 Roleplay: ${character.name}`,
      `*Tanggal:* ${new Date().toLocaleDateString()} | *Model AI:* \`${activeModel}\``,
      `*Pemain / User:* ${persona?.name || 'Pemain'}`,
      `*Skenario:* ${character.scenario || character.tagline || 'Petualangan Interaktif'}`,
      '',
      '---',
      '',
      ...messages.map((m) => {
        const isAI = m.role === 'assistant';
        const sender = isAI ? `### 🤖 ${character.name}` : `### 👤 ${persona?.name || 'Kamu'}`;
        const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${sender}  *(${time})*\n\n${m.content}\n`;
      }),
    ].join('\n');

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roleplay_${character.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDropdownOpen(false);
    showNotification('Obrolan diekspor sebagai .md');
  };

  const handleExportJson = async () => {
    if (!selectedSessionId) return;
    const session = await db.chatSessions.get(selectedSessionId);
    const messages = await db.chatMessages.where('sessionId').equals(selectedSessionId).sortBy('timestamp');

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      character: {
        id: character.id,
        name: character.name,
        category: character.category,
      },
      persona: persona ? { id: persona.id, name: persona.name } : undefined,
      session,
      messages,
    };

    downloadJson(`chat_session_${character.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`, exportData);
    setExportDropdownOpen(false);
    showNotification('Obrolan diekspor sebagai .json');
  };

  return (
    <div className="glass-panel border-b border-white/10 px-4 py-3 flex flex-col gap-2 shrink-0 relative">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Character Info */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 md:hidden cursor-pointer shrink-0"
            title="Kembali ke Dashboard"
          >
            <Compass className="w-5 h-5" />
          </Link>

          <div className="relative shrink-0">
            {character.avatar ? (
              <img
                src={character.avatar}
                alt={character.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-cyan-500/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold ring-2 ring-cyan-500/30">
                <Bot className="w-5 h-5" />
              </div>
            )}
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
            title="Bermain sebagai persona"
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-zinc-400">Pemain:</span>
            <span className="font-semibold text-zinc-200">{persona?.name || 'Persona'}</span>
          </button>

          {/* Search Toggle */}
          {onToggleSearch && (
            <button
              onClick={onToggleSearch}
              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                isSearchOpen
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-white border-white/10'
              }`}
              title="Cari Pesan dalam Sesi"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

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

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Ekspor Percakapan"
            >
              <Download className="w-4 h-4" />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 glass-panel rounded-2xl p-1.5 shadow-2xl z-50 border border-white/10 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-white/5">
                  Ekspor Riwayat Chat
                </div>

                <button
                  onClick={handleExportMarkdown}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="font-medium">Markdown (.md)</p>
                    <p className="text-[10px] text-zinc-400">Format cantik berstruktur</p>
                  </div>
                </button>

                <button
                  onClick={handleExportText}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <div>
                    <p className="font-medium">Plain Text (.txt)</p>
                    <p className="text-[10px] text-zinc-400">Naskah teks sederhana</p>
                  </div>
                </button>

                <button
                  onClick={handleExportJson}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="font-medium">JSON Data (.json)</p>
                    <p className="text-[10px] text-zinc-400">Data raw & swipes</p>
                  </div>
                </button>
              </div>
            )}
          </div>

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

      {/* Search Input Bar inside Header */}
      {isSearchOpen && (
        <div className="pt-2 border-t border-white/5 flex items-center gap-2 animate-in slide-in-from-top-1 duration-150">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Cari kata kunci dalam riwayat pesan sesi ini..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl glass-input text-xs placeholder:text-zinc-500 focus:outline-none"
              autoFocus
            />
            {searchKeyword && (
              <button
                onClick={() => onSearchChange && onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={onToggleSearch}
            className="px-2.5 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Export notification toast */}
      {copiedNotification && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-emerald-500/90 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-lg animate-in fade-in slide-in-from-bottom-2 z-50">
          <Check className="w-3.5 h-3.5" />
          <span>{copiedNotification}</span>
        </div>
      )}
    </div>
  );
}

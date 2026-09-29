'use client';

import React, { useState } from 'react';
import { Character, UserPersona } from '@/types';
import { useAppStore } from '@/lib/store';
import { useLiveQuery } from 'dexie-react-hooks';
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
  Brain,
  Clapperboard,
  MoreVertical,
} from 'lucide-react';
import { downloadJson } from '@/lib/utils';
import { db } from '@/lib/db';
import { getRelationshipTier } from '@/lib/relationship';
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
    isMemoryDrawerOpen,
    setIsMemoryDrawerOpen,
    isRelationshipDrawerOpen,
    setIsRelationshipDrawerOpen,
    isAuthorsNoteDrawerOpen,
    setIsAuthorsNoteDrawerOpen,
    setIsPersonaModalOpen,
    selectedSessionId,
    settings,
    theme,
  } = useAppStore();

  const session = useLiveQuery(
    () => (selectedSessionId ? db.chatSessions.get(selectedSessionId) : undefined),
    [selectedSessionId]
  );
  const currentLevel = session?.affinityLevel || 1;
  const relationshipTier = getRelationshipTier(currentLevel);

  const memories = useLiveQuery(
    () => (selectedSessionId ? db.sessionMemories.where('sessionId').equals(selectedSessionId).toArray() : []),
    [selectedSessionId]
  ) || [];
  const activeMemoryCount = memories.filter((m) => m.enabled).length;

  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const activeModel = character.customModel || settings.defaultModel;
  const isDark = theme === 'dark';

  const showNotification = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 2000);
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
    setMobileMenuOpen(false);
    showNotification('Diekspor sebagai .txt');
  };

  const handleExportMarkdown = async () => {
    if (!selectedSessionId) return;
    const messages = await db.chatMessages.where('sessionId').equals(selectedSessionId).sortBy('timestamp');

    const mdContent = [
      `# Roleplay: ${character.name}`,
      `*Tanggal:* ${new Date().toLocaleDateString()} | *Model:* \`${activeModel}\``,
      `*Pemain:* ${persona?.name || 'Pemain'}`,
      `*Skenario:* ${character.scenario || character.tagline || 'Petualangan'}`,
      '',
      '---',
      '',
      ...messages.map((m) => {
        const isAI = m.role === 'assistant';
        const sender = isAI ? `### ${character.name}` : `### ${persona?.name || 'Kamu'}`;
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
    setMobileMenuOpen(false);
    showNotification('Diekspor sebagai .md');
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

    downloadJson(`chat_${character.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`, exportData);
    setExportDropdownOpen(false);
    setMobileMenuOpen(false);
    showNotification('Diekspor sebagai .json');
  };

  return (
    <div className={`sticky top-0 z-20 border-b px-3 sm:px-4 py-2 sm:py-2.5 flex flex-col gap-2 shrink-0 backdrop-blur-md transition-colors ${
      isDark ? 'border-zinc-800 bg-zinc-950/90' : 'border-zinc-200 bg-white/90'
    }`}>
      <div className="flex items-center justify-between gap-2 min-w-0">
        {/* Character Info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Link
            href="/"
            className={`p-1.5 rounded-lg md:hidden cursor-pointer shrink-0 ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
            }`}
            title="Dashboard"
          >
            <Compass className="w-4 h-4" />
          </Link>

          <div className="relative shrink-0">
            {character.avatar ? (
              <img
                src={character.avatar}
                alt={character.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
              />
            ) : (
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-700'
              }`}>
                <Bot className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="font-semibold text-xs sm:text-sm truncate">{character.name}</h2>
              <span className={`hidden md:inline-flex text-[10px] px-1.5 py-0.2 rounded font-mono border ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
              }`}>
                {activeModel}
              </span>
            </div>
            <p className={`text-[11px] truncate max-w-md hidden sm:block ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              {character.tagline || character.description}
            </p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Active Persona Badge (large screen) */}
          <button
            onClick={() => setIsPersonaModalOpen(true)}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition-colors ${
              isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
            }`}
            title="Persona Pemain"
          >
            <User className="w-3 h-3 text-zinc-400" />
            <span className="font-medium">{persona?.name || 'Persona'}</span>
          </button>

          {/* Relationship Level Pill */}
          <button
            onClick={() => setIsRelationshipDrawerOpen(!isRelationshipDrawerOpen)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              isRelationshipDrawerOpen
                ? isDark ? 'bg-zinc-800 border-rose-500/50 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-700'
                : isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700' : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
            }`}
            title={`Tingkatan Hubungan: Lv. ${currentLevel} (${relationshipTier.title})`}
          >
            <span className="text-xs">{relationshipTier.emoji}</span>
            <span className="font-mono text-[11px] text-rose-400 font-bold">Lv.{currentLevel}</span>
            <span className="hidden sm:inline font-medium">{relationshipTier.title}</span>
          </button>

          {/* Toggle Memory Drawer */}
          <button
            onClick={() => setIsMemoryDrawerOpen(!isMemoryDrawerOpen)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              isMemoryDrawerOpen
                ? isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-zinc-200 text-zinc-900 border-zinc-300'
                : isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-900'
            }`}
            title="Buku Memori Peristiwa Karakter"
          >
            <Brain className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Memori</span>
            {activeMemoryCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isDark ? 'bg-zinc-800 text-amber-400' : 'bg-amber-100 text-amber-800'
              }`}>
                {activeMemoryCount}
              </span>
            )}
          </button>

          {/* Toggle Author's Note / Plot Director */}
          <button
            onClick={() => setIsAuthorsNoteDrawerOpen(!isAuthorsNoteDrawerOpen)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              isAuthorsNoteDrawerOpen || (session?.authorsNoteEnabled && session?.authorsNote)
                ? isDark ? 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300' : 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-900'
            }`}
            title="Pengarah Plot / Author's Note (Instruksi Skenario Khusus)"
          >
            <Clapperboard className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Plot</span>
            {session?.authorsNoteEnabled && session?.authorsNote && (
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            )}
          </button>

          {/* Desktop Actions (sm and up) */}
          <div className="hidden sm:flex items-center gap-1.5">
            {/* Search Toggle */}
            {onToggleSearch && (
              <button
                onClick={onToggleSearch}
                className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                  isSearchOpen
                    ? isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-zinc-200 text-zinc-900 border-zinc-300'
                    : isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-900'
                }`}
                title="Cari Pesan"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Toggle Scenario Drawer */}
            <button
              onClick={() => setIsScenarioDrawerOpen(!isScenarioDrawerOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                isScenarioDrawerOpen
                  ? isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-zinc-200 text-zinc-900 border-zinc-300'
                  : isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-900'
              }`}
              title="Skenario & Info"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Skenario</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-900'
                }`}
                title="Ekspor Chat"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {exportDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setExportDropdownOpen(false)}
                  />
                  <div className={`absolute right-0 mt-2 w-48 rounded-xl p-1 shadow-xl z-50 border space-y-0.5 ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}>
                    <div className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider border-b ${
                      isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-100 text-zinc-400'
                    }`}>
                      Ekspor Chat
                    </div>

                    <button
                      onClick={handleExportMarkdown}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Markdown (.md)</span>
                    </button>

                    <button
                      onClick={handleExportText}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Plain Text (.txt)</span>
                    </button>

                    <button
                      onClick={handleExportJson}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                      <span>JSON (.json)</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Clear Session */}
            <button
              onClick={onClearSession}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-rose-600 hover:bg-rose-50'
              }`}
              title="Mulai Ulang Chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile More Options Menu (<sm) */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                mobileMenuOpen
                  ? isDark ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-zinc-200 text-zinc-900 border-zinc-300'
                  : isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-900'
              }`}
              title="Opsi Tambahan"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {mobileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className={`absolute right-0 mt-2 w-52 rounded-xl p-1.5 shadow-2xl z-50 border space-y-1 ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                }`}>
                  <div className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider border-b ${
                    isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-100 text-zinc-400'
                  }`}>
                    Menu Chat
                  </div>

                  {onToggleSearch && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onToggleSearch();
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs cursor-pointer ${
                        isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      <Search className="w-4 h-4 text-zinc-400" />
                      <span>{isSearchOpen ? 'Tutup Pencarian' : 'Cari Pesan'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsAuthorsNoteDrawerOpen(!isAuthorsNoteDrawerOpen);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs cursor-pointer ${
                      isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    <Clapperboard className="w-4 h-4 text-indigo-400" />
                    <span className="flex-1">Pengarah Plot (Author&apos;s Note)</span>
                    {session?.authorsNoteEnabled && session?.authorsNote && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsScenarioDrawerOpen(!isScenarioDrawerOpen);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs cursor-pointer ${
                      isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-zinc-400" />
                    <span>Skenario & Pengetahuan</span>
                  </button>

                  <div className={`my-1 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`} />

                  <div className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Ekspor Riwayat
                  </div>

                  <button
                    onClick={handleExportMarkdown}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs cursor-pointer ${
                      isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-zinc-400" />
                    <span>Markdown (.md)</span>
                  </button>

                  <button
                    onClick={handleExportText}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs cursor-pointer ${
                      isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-zinc-400" />
                    <span>Plain Text (.txt)</span>
                  </button>

                  <button
                    onClick={handleExportJson}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs cursor-pointer ${
                      isDark ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    <FileCode className="w-4 h-4 text-zinc-400" />
                    <span>JSON (.json)</span>
                  </button>

                  <div className={`my-1 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`} />

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onClearSession();
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-xs text-rose-500 hover:bg-rose-500/10 cursor-pointer`}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Mulai Ulang Chat</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      {isSearchOpen && (
        <div className={`pt-2 border-t flex items-center gap-2 ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder="Cari dalam pesan..."
              className={`w-full pl-8 pr-7 py-1 rounded-lg text-xs border ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
              }`}
              autoFocus
            />
            {searchKeyword && (
              <button
                onClick={() => onSearchChange && onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={onToggleSearch}
            className="px-2 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Notification toast */}
      {copiedNotification && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs flex items-center gap-1.5 shadow-lg z-50">
          <Check className="w-3 h-3 text-emerald-400" />
          <span>{copiedNotification}</span>
        </div>
      )}
    </div>
  );
}

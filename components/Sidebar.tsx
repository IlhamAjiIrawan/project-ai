'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import {
  MessageSquarePlus,
  Compass,
  Trash2,
  Users,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  SlidersHorizontal,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ChatSession } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    selectedCharacterId,
    setSelectedCharacterId,
    selectedSessionId,
    setSelectedSessionId,
    selectedPersonaId,
    theme,
  } = useAppStore();

  const characters = useLiveQuery(() => db.characters.toArray(), []) || [];
  const sessions = useLiveQuery(() => db.chatSessions.orderBy('updatedAt').reverse().toArray(), []) || [];
  const personas = useLiveQuery(() => db.personas.toArray(), []) || [];
  const activePersona = personas.find((p) => p.id === selectedPersonaId) || personas[0];

  const isDark = theme === 'dark';

  const handleStartNewChat = async (charId?: string) => {
    const targetCharId = charId || selectedCharacterId || characters[0]?.id;
    if (!targetCharId) return;

    const char = characters.find((c) => c.id === targetCharId);
    if (!char) return;

    // Create a new session in DB
    const newSessionId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      characterId: targetCharId,
      personaId: selectedPersonaId || undefined,
      title: `${char.name}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastMessagePreview: char.greetingMessage.substring(0, 60) + '...',
    };

    await db.chatSessions.put(newSession);

    // Add greeting message
    await db.chatMessages.put({
      id: `msg_${Date.now()}`,
      sessionId: newSessionId,
      role: 'assistant',
      content: char.greetingMessage,
      timestamp: Date.now(),
      modelUsed: char.customModel || 'system-greeting',
    });

    setSelectedCharacterId(targetCharId);
    setSelectedSessionId(newSessionId);
    router.push('/chat');
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm('Hapus riwayat sesi obrolan ini?')) {
      await db.chatMessages.where('sessionId').equals(sessionId).delete();
      await db.chatSessions.delete(sessionId);
      if (selectedSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        if (remaining.length > 0) {
          setSelectedSessionId(remaining[0].id);
          setSelectedCharacterId(remaining[0].characterId);
        } else {
          setSelectedSessionId(null);
        }
      }
    }
  };

  const handleSelectSession = (session: ChatSession) => {
    setSelectedSessionId(session.id);
    setSelectedCharacterId(session.characterId);
    router.push('/chat');
  };

  const navMenuItems = [
    { href: '/', label: 'Dashboard', icon: Compass },
    { href: '/chat', label: 'Ruang Chat', icon: MessageSquare },
    { href: '/characters', label: 'Studio Karakter', icon: Sparkles },
    { href: '/personas', label: 'Persona Pemain', icon: Users },
    { href: '/settings', label: 'Pengaturan API', icon: SlidersHorizontal },
  ];

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-30 flex flex-col border-r transition-all duration-200 ${
        isDark ? 'bg-zinc-950 border-zinc-800/80 text-zinc-100' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
      } ${isOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-16'}`}
    >
      {/* Top Action / New Chat Button */}
      <div className={`p-3 border-b flex items-center justify-between gap-2 ${isDark ? 'border-zinc-800/80' : 'border-zinc-200'}`}>
        {isOpen ? (
          <button
            onClick={() => handleStartNewChat()}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
              isDark
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border-zinc-800'
                : 'bg-white hover:bg-zinc-100 text-zinc-900 border-zinc-200 shadow-sm'
            }`}
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Chat Baru</span>
          </button>
        ) : (
          <button
            onClick={() => handleStartNewChat()}
            title="Chat Baru"
            className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
              isDark
                ? 'bg-zinc-900 text-zinc-100 border-zinc-800 hover:bg-zinc-800'
                : 'bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-100 shadow-sm'
            }`}
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
        )}

        {/* Toggle Collapse Button */}
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer hidden md:flex ${
            isDark ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'
          }`}
          title={isOpen ? "Sembunyikan Sidebar" : "Buka Sidebar"}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Content: Navigation & Sessions */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Primary Nav Menu */}
        <div className="space-y-0.5">
          {navMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!isOpen ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? isDark
                      ? 'bg-zinc-800 text-zinc-100 font-semibold'
                      : 'bg-zinc-200/70 text-zinc-900 font-semibold'
                    : isDark
                      ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {isOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Quick Characters List */}
        {isOpen && characters.length > 0 && (
          <div>
            <div className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Karakter
            </div>
            <div className="grid grid-cols-5 gap-1.5 py-1">
              {characters.slice(0, 5).map((char) => (
                <button
                  key={char.id}
                  onClick={() => handleStartNewChat(char.id)}
                  title={`Chat dengan ${char.name}`}
                  className={`relative rounded-lg overflow-hidden aspect-square border transition-transform hover:scale-105 cursor-pointer flex items-center justify-center ${
                    isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'
                  }`}
                >
                  {char.avatar ? (
                    <img
                      src={char.avatar}
                      alt={char.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-bold">{char.name.charAt(0)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Chat Sessions */}
        <div>
          {isOpen && (
            <div className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between ${
              isDark ? 'text-zinc-500' : 'text-zinc-400'
            }`}>
              <span>Riwayat Sesi</span>
              <span className="font-normal">{sessions.length}</span>
            </div>
          )}

          <div className="space-y-0.5 mt-1">
            {sessions.length === 0 ? (
              isOpen && (
                <p className={`text-xs px-2 py-2 text-center ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Belum ada riwayat.
                </p>
              )
            ) : (
              sessions.map((session) => {
                const char = characters.find((c) => c.id === session.characterId);
                const isSelected = pathname === '/chat' && selectedSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session)}
                    className={`group relative flex items-center gap-2 p-2 rounded-lg text-xs transition-colors cursor-pointer border ${
                      isSelected
                        ? isDark
                          ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                          : 'bg-zinc-200/80 text-zinc-900 border-zinc-300'
                        : isDark
                          ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border-transparent'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
                    }`}
                  >
                    {char?.avatar ? (
                      <img
                        src={char.avatar}
                        alt={char.name}
                        className="w-6 h-6 rounded-md object-cover shrink-0"
                      />
                    ) : (
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                        <span className="text-[10px] font-bold">{(char?.name || session.title).charAt(0)}</span>
                      </div>
                    )}

                    {isOpen && (
                      <div className="flex-1 min-w-0 pr-5">
                        <p className="font-medium truncate">
                          {char?.name || session.title}
                        </p>
                        <p className={`text-[10px] truncate ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          {session.lastMessagePreview || formatDate(session.updatedAt)}
                        </p>
                      </div>
                    )}

                    {isOpen && (
                      <button
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="absolute right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded hover:text-rose-500 transition-opacity cursor-pointer"
                        title="Hapus Sesi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer / Active Persona */}
      <div className={`p-2 border-t ${isDark ? 'border-zinc-800/80' : 'border-zinc-200'}`}>
        {isOpen ? (
          <Link
            href="/personas"
            className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-zinc-900 text-zinc-300 hover:text-white' : 'hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950'
            }`}
            title="Kelola Persona Pemain"
          >
            <img
              src={activePersona?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={activePersona?.name || 'Persona'}
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">
                {activePersona?.name || 'Persona'}
              </p>
            </div>
          </Link>
        ) : (
          <Link
            href="/personas"
            title="Persona Pemain"
            className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
              isDark ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Users className="w-4 h-4" />
          </Link>
        )}
      </div>
    </aside>
  );
}

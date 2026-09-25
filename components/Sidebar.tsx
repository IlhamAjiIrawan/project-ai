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
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Flame,
  MessageSquare,
  Layers,
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
  } = useAppStore();

  const characters = useLiveQuery(() => db.characters.toArray(), []) || [];
  const sessions = useLiveQuery(() => db.chatSessions.orderBy('updatedAt').reverse().toArray(), []) || [];
  const personas = useLiveQuery(() => db.personas.toArray(), []) || [];
  const activePersona = personas.find((p) => p.id === selectedPersonaId) || personas[0];

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
      title: `Petualangan bersama ${char.name}`,
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
      className={`fixed md:static inset-y-0 left-0 z-30 flex flex-col bg-zinc-950/95 md:bg-zinc-950/70 border-r border-white/10 backdrop-blur-xl transition-all duration-300 ${
        isOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-16'
      }`}
    >
      {/* Top Action / New Chat Button */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between gap-2">
        {isOpen ? (
          <button
            onClick={() => handleStartNewChat()}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 hover:from-cyan-500/30 hover:to-violet-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4 text-cyan-400" />
            <span>Chat Roleplay Baru</span>
          </button>
        ) : (
          <button
            onClick={() => handleStartNewChat()}
            title="Chat Baru"
            className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center hover:bg-cyan-500/30 cursor-pointer"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        )}

        {/* Toggle Collapse Button */}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer hidden md:flex"
          title={isOpen ? "Sembunyikan Sidebar" : "Buka Sidebar"}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Content: Navigation & Sessions */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Primary Nav Menu for Mobile / Collapsed mode */}
        <div className="space-y-1">
          {navMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!isOpen ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-zinc-400'}`} />
                {isOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Quick Characters List */}
        {isOpen && characters.length > 0 && (
          <div>
            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              <span>Karakter Cepat</span>
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="grid grid-cols-5 gap-1.5 py-1">
              {characters.slice(0, 5).map((char) => (
                <button
                  key={char.id}
                  onClick={() => handleStartNewChat(char.id)}
                  title={`Chat dengan ${char.name}`}
                  className="group relative rounded-xl overflow-hidden aspect-square border border-white/10 hover:border-cyan-400 transition-all cursor-pointer"
                >
                  <img
                    src={char.avatar}
                    alt={char.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-0.5">
                    <span className="text-[8px] text-white truncate font-medium">{char.name.split(' ')[0]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Chat Sessions */}
        <div>
          {isOpen && (
            <div className="px-2 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Riwayat Sesi</span>
              <span className="text-[10px] text-zinc-400 font-normal">{sessions.length}</span>
            </div>
          )}

          <div className="space-y-1 mt-1">
            {sessions.length === 0 ? (
              isOpen && (
                <p className="text-[11px] text-zinc-400 px-2 py-3 italic text-center">
                  Belum ada riwayat obrolan. Mulai petualangan baru!
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
                    className={`group relative flex items-center gap-2.5 p-2 rounded-xl text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {char?.avatar ? (
                      <img
                        src={char.avatar}
                        alt={char.name}
                        className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                        <Flame className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                    )}

                    {isOpen && (
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="font-medium text-zinc-200 truncate group-hover:text-white">
                          {char?.name || session.title}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {session.lastMessagePreview || formatDate(session.updatedAt)}
                        </p>
                      </div>
                    )}

                    {isOpen && (
                      <button
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 transition-all cursor-pointer"
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

      {/* Footer / Active Persona Link */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {isOpen ? (
          <Link
            href="/personas"
            className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer group"
            title="Kelola Persona Pemain"
          >
            <img
              src={activePersona?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={activePersona?.name || 'Persona'}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-cyan-400/40 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-cyan-300">
                {activePersona?.name || 'User Persona'}
              </p>
              <p className="text-[10px] text-zinc-400 truncate">Klik untuk kelola profil</p>
            </div>
          </Link>
        ) : (
          <Link
            href="/personas"
            title="Persona Pemain"
            className="w-10 h-10 mx-auto rounded-xl bg-white/5 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
          >
            <Users className="w-5 h-5 text-cyan-400" />
          </Link>
        )}
      </div>
    </aside>
  );
}

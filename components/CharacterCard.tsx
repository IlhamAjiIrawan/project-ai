'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Character, ChatSession } from '@/types';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/db';
import { MessageSquare, Edit3, Trash2, Download, Sparkles } from 'lucide-react';
import { downloadJson } from '@/lib/utils';

interface CharacterCardProps {
  character: Character;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  scifi: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  fantasy: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  anime: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  mystery: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  rpg: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  romance: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  assistant: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  custom: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
};

export function CharacterCard({ character }: CharacterCardProps) {
  const router = useRouter();
  const {
    setSelectedCharacterId,
    setSelectedSessionId,
    setEditingCharacter,
    setIsCharacterModalOpen,
    selectedPersonaId,
  } = useAppStore();

  const categoryStyle = CATEGORY_COLORS[character.category] || CATEGORY_COLORS.custom;

  const handleStartChat = async () => {
    // Check if there is already an existing session for this character
    const existingSession = await db.chatSessions
      .where('characterId')
      .equals(character.id)
      .last();

    if (existingSession) {
      setSelectedCharacterId(character.id);
      setSelectedSessionId(existingSession.id);
      router.push('/chat');
    } else {
      // Create new session
      const newSessionId = `session_${Date.now()}`;
      const newSession: ChatSession = {
        id: newSessionId,
        characterId: character.id,
        personaId: selectedPersonaId || undefined,
        title: `Roleplay: ${character.name}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastMessagePreview: character.greetingMessage.substring(0, 60) + '...',
      };

      await db.chatSessions.put(newSession);

      // Add greeting
      await db.chatMessages.put({
        id: `msg_${Date.now()}`,
        sessionId: newSessionId,
        role: 'assistant',
        content: character.greetingMessage,
        timestamp: Date.now(),
        modelUsed: character.customModel || 'system-greeting',
      });

      setSelectedCharacterId(character.id);
      setSelectedSessionId(newSessionId);
      router.push('/chat');
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCharacter(character);
    setIsCharacterModalOpen(true);
  };

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadJson(`${character.name.toLowerCase().replace(/\s+/g, '_')}_card.json`, character);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Hapus karakter "${character.name}" beserta riwayat chat-nya?`)) {
      await db.chatMessages.where('sessionId').anyOf(
        (await db.chatSessions.where('characterId').equals(character.id).toArray()).map((s) => s.id)
      ).delete();
      await db.chatSessions.where('characterId').equals(character.id).delete();
      await db.characters.delete(character.id);
    }
  };

  return (
    <div
      onClick={handleStartChat}
      className="glass-card group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-cyan-500/40 transition-all duration-300 shadow-md hover:shadow-cyan-500/15"
    >
      {/* Top Banner Image with Gradient */}
      <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
        <img
          src={character.avatar}
          alt={character.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

        {/* Category Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
          >
            {character.category}
          </span>
          {character.customModel && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-900/80 text-zinc-300 border border-white/10 backdrop-blur-md">
              {character.customModel}
            </span>
          )}
        </div>

        {/* Quick Action Buttons on Top Right */}
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleExport}
            title="Ekspor Karakter (JSON)"
            className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleEdit}
            title="Edit Karakter"
            className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          {character.isCustom && (
            <button
              onClick={handleDelete}
              title="Hapus Karakter"
              className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-400 border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
            {character.name}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 font-light leading-relaxed">
            {character.tagline || character.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {character.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 border border-white/5 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Card Footer Button */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Siap Chat</span>
          </div>

          <span className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
            <MessageSquare className="w-3.5 h-3.5" />
            Mulai Chat
          </span>
        </div>
      </div>
    </div>
  );
}

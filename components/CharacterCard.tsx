'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Character, ChatSession } from '@/types';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/db';
import { MessageSquare, Edit3, Trash2, Download, Bot } from 'lucide-react';
import { downloadJson } from '@/lib/utils';

interface CharacterCardProps {
  character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
  const router = useRouter();
  const {
    setSelectedCharacterId,
    setSelectedSessionId,
    setEditingCharacter,
    setIsCharacterModalOpen,
    selectedPersonaId,
    theme,
  } = useAppStore();

  const isDark = theme === 'dark';

  const handleStartChat = async () => {
    const existingSession = await db.chatSessions
      .where('characterId')
      .equals(character.id)
      .last();

    if (existingSession) {
      setSelectedCharacterId(character.id);
      setSelectedSessionId(existingSession.id);
      router.push('/chat');
    } else {
      const newSessionId = `session_${Date.now()}`;
      const newSession: ChatSession = {
        id: newSessionId,
        characterId: character.id,
        personaId: selectedPersonaId || undefined,
        title: `${character.name}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastMessagePreview: character.greetingMessage.substring(0, 60) + '...',
      };

      await db.chatSessions.put(newSession);

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
      className={`group relative flex flex-col rounded-xl overflow-hidden cursor-pointer border transition-all duration-200 ${
        isDark
          ? 'bg-zinc-900/60 border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900'
          : 'bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm'
      }`}
    >
      {/* Avatar / Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-zinc-950/20 flex items-center justify-center">
        {character.avatar ? (
          <img
            src={character.avatar}
            alt={character.name}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
            <Bot className="w-8 h-8 mb-1" />
            <span className="text-xs font-medium">{character.name}</span>
          </div>
        )}
        <div className={`absolute inset-0 ${
          isDark
            ? 'bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent'
            : 'bg-gradient-to-t from-black/60 via-transparent to-transparent'
        }`} />

        {/* Category Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/10">
            {character.category}
          </span>
        </div>

        {/* Quick Actions (Hover) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleExport}
            title="Ekspor Karakter (JSON)"
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleEdit}
            title="Edit Karakter"
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          {character.isCustom && (
            <button
              onClick={handleDelete}
              title="Hapus Karakter"
              className="p-1.5 rounded-lg bg-black/60 hover:bg-rose-600 text-white backdrop-blur-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Card Details */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="text-sm font-semibold truncate">
            {character.name}
          </h3>
          <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {character.tagline || character.description}
          </p>

          {/* Tags */}
          {character.tags && character.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {character.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    isDark
                      ? 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                  }`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className={`pt-2.5 border-t flex items-center justify-between text-xs ${
          isDark ? 'border-zinc-800/80' : 'border-zinc-100'
        }`}>
          <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {character.customModel ? character.customModel : 'Siap Chat'}
          </span>

          <span className="flex items-center gap-1 font-medium transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </span>
        </div>
      </div>
    </div>
  );
}

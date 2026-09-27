'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { ScenarioDrawer } from './ScenarioDrawer';
import { MemoryDrawer } from './MemoryDrawer';
import { PinMemoryModal } from './PinMemoryModal';
import { RelationshipDrawer } from './RelationshipDrawer';
import { generateRoleplayResponse } from '@/lib/providers/engine';
import { calculateAffinityProgress } from '@/lib/relationship';
import { ChatMessage, ChatSession } from '@/types';
import { Bot } from 'lucide-react';

export function ChatInterface() {
  const {
    selectedCharacterId,
    selectedSessionId,
    setSelectedSessionId,
    selectedPersonaId,
    setIsSettingsOpen,
    isGenerating,
    setIsGenerating,
    setActiveStreamingMessage,
    abortController,
    setAbortController,
    settings,
    theme,
  } = useAppStore();

  const characters = useLiveQuery(() => db.characters.toArray(), []) || [];
  const personas = useLiveQuery(() => db.personas.toArray(), []) || [];
  const session = useLiveQuery(
    () => (selectedSessionId ? db.chatSessions.get(selectedSessionId) : undefined),
    [selectedSessionId]
  );

  const character = characters.find((c) => c.id === selectedCharacterId) || characters[0];
  const persona = personas.find((p) => p.id === selectedPersonaId) || personas.find((p) => p.isDefault) || personas[0];

  const messages = useLiveQuery(
    () => (selectedSessionId ? db.chatMessages.where('sessionId').equals(selectedSessionId).sortBy('timestamp') : []),
    [selectedSessionId]
  ) || [];

  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isDark = theme === 'dark';

  const displayedMessages = useMemo(() => {
    if (!searchKeyword.trim()) return messages;
    const q = searchKeyword.toLowerCase().trim();
    return messages.filter((m) => {
      const matchContent = m.content.toLowerCase().includes(q);
      const matchSwipes = m.swipes?.some((s) => s.toLowerCase().includes(q));
      return matchContent || matchSwipes;
    });
  }, [messages, searchKeyword]);

  // Ensure session exists
  useEffect(() => {
    async function ensureSession() {
      if (!character) return;
      if (!selectedSessionId) {
        const existingSession = await db.chatSessions.where('characterId').equals(character.id).last();
        if (existingSession) {
          setSelectedSessionId(existingSession.id);
        } else {
          const newSessionId = `session_${Date.now()}`;
          const newSession: ChatSession = {
            id: newSessionId,
            characterId: character.id,
            personaId: persona?.id,
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
          setSelectedSessionId(newSessionId);
        }
      }
    }
    ensureSession();
  }, [character, selectedSessionId, setSelectedSessionId, persona]);

  if (!character) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <Bot className="w-10 h-10 text-zinc-400" />
        <h3 className="text-base font-semibold">Pilih Karakter untuk Memulai Chat</h3>
        <Link
          href="/"
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
            isDark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'
          }`}
        >
          Buka Galeri Karakter
        </Link>
      </div>
    );
  }

  // Handle Send Message
  const handleSendMessage = async (text: string) => {
    if (!selectedSessionId || !text.trim() || isGenerating) return;

    const provider = character.customProvider || settings.defaultProvider;
    const isKeySet =
      (provider === 'gemini' && settings.geminiApiKey) ||
      (provider === 'openrouter' && settings.openRouterApiKey) ||
      (provider === 'groq' && settings.groqApiKey) ||
      (provider === 'openai' && settings.openaiApiKey) ||
      (provider === 'custom' && settings.customBaseUrl);

    if (!isKeySet) {
      setIsSettingsOpen(true);
      alert(`Mohon masukkan API Key untuk provider ${provider.toUpperCase()} di Pengaturan.`);
      return;
    }

    const userMessageId = `msg_user_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      sessionId: selectedSessionId,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    await db.chatMessages.put(userMessage);

    const userMessageCount = messages.filter((m) => m.role === 'user').length;
    const sessionTitleUpdate: Partial<ChatSession> = {
      updatedAt: Date.now(),
      lastMessagePreview: text.substring(0, 60),
    };
    if (userMessageCount === 0) {
      const snippet = text.length > 30 ? text.substring(0, 28).trim() + '...' : text;
      sessionTitleUpdate.title = `${character.name} - ${snippet}`;
    }

    await db.chatSessions.update(selectedSessionId, sessionTitleUpdate);

    // Start Streaming
    const ac = new AbortController();
    setAbortController(ac);
    setIsGenerating(true);
    setActiveStreamingMessage('');

    try {
      const allMessages = await db.chatMessages.where('sessionId').equals(selectedSessionId).sortBy('timestamp');
      const sessionMemories = await db.sessionMemories.where('sessionId').equals(selectedSessionId).toArray();

      const currentLevel = session?.affinityLevel || 1;
      const currentExp = session?.affinityExp || 0;
      const expGain = Math.min(35, Math.max(10, Math.floor(text.length / 12) + 10));
      const affinityProgress = calculateAffinityProgress(currentLevel, currentExp, expGain);

      let accumulated = '';
      const finalReply = await generateRoleplayResponse({
        character,
        userPersona: persona,
        chatHistory: allMessages,
        newUserMessage: text,
        settings,
        memories: sessionMemories,
        affinityLevel: currentLevel,
        onChunk: (chunk) => {
          accumulated += chunk;
          setActiveStreamingMessage(accumulated);
        },
        signal: ac.signal,
      });

      const assistantMessageId = `msg_ai_${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        sessionId: selectedSessionId,
        role: 'assistant',
        content: finalReply,
        swipes: [finalReply],
        currentSwipeIndex: 0,
        timestamp: Date.now(),
        modelUsed: character.customModel || settings.defaultModel,
        providerUsed: character.customProvider || settings.defaultProvider,
      };

      await db.chatMessages.put(assistantMessage);
      await db.chatSessions.update(selectedSessionId, {
        updatedAt: Date.now(),
        lastMessagePreview: finalReply.substring(0, 60),
        affinityLevel: affinityProgress.newLevel,
        affinityExp: affinityProgress.newExp,
        relationshipTitle: affinityProgress.newTier.title,
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (error?.name !== 'AbortError') {
        alert(`Gagal menghasilkan balasan: ${error?.message || 'Terjadi kesalahan'}`);
      }
    } finally {
      setIsGenerating(false);
      setActiveStreamingMessage('');
      setAbortController(null);
    }
  };

  const handleReroll = async (messageId: string) => {
    if (!selectedSessionId || isGenerating) return;

    const targetMsg = await db.chatMessages.get(messageId);
    if (!targetMsg || targetMsg.role !== 'assistant') return;

    const allMessages = await db.chatMessages.where('sessionId').equals(selectedSessionId).sortBy('timestamp');
    const targetIdx = allMessages.findIndex((m) => m.id === messageId);
    const precedingHistory = targetIdx > 0 ? allMessages.slice(0, targetIdx) : [];
    const sessionMemories = await db.sessionMemories.where('sessionId').equals(selectedSessionId).toArray();
    const currentLevel = session?.affinityLevel || 1;

    const ac = new AbortController();
    setAbortController(ac);
    setIsGenerating(true);
    setActiveStreamingMessage('');

    try {
      let accumulated = '';
      const newSwipeReply = await generateRoleplayResponse({
        character,
        userPersona: persona,
        chatHistory: precedingHistory,
        newUserMessage: '',
        settings,
        memories: sessionMemories,
        affinityLevel: currentLevel,
        onChunk: (chunk) => {
          accumulated += chunk;
          setActiveStreamingMessage(accumulated);
        },
        signal: ac.signal,
      });

      const updatedSwipes = [...(targetMsg.swipes || [targetMsg.content]), newSwipeReply];
      await db.chatMessages.update(messageId, {
        content: newSwipeReply,
        swipes: updatedSwipes,
        currentSwipeIndex: updatedSwipes.length - 1,
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (error?.name !== 'AbortError') {
        alert(`Gagal reroll balasan: ${error?.message || 'Terjadi kesalahan'}`);
      }
    } finally {
      setIsGenerating(false);
      setActiveStreamingMessage('');
      setAbortController(null);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    const target = await db.chatMessages.get(messageId);
    if (!target) return;
    const swipes = target.swipes ? [...target.swipes] : [target.content];
    const currentIdx = target.currentSwipeIndex ?? swipes.length - 1;
    swipes[currentIdx] = newContent;

    await db.chatMessages.update(messageId, {
      content: newContent,
      swipes,
    });
  };

  const handleDeleteMessage = async (messageId: string) => {
    await db.chatMessages.delete(messageId);
  };

  const handleSwipeChange = async (messageId: string, newIndex: number) => {
    const target = await db.chatMessages.get(messageId);
    if (!target || !target.swipes || !target.swipes[newIndex]) return;

    await db.chatMessages.update(messageId, {
      content: target.swipes[newIndex],
      currentSwipeIndex: newIndex,
    });
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
    }
    setIsGenerating(false);
    setActiveStreamingMessage('');
  };

  const handleClearSession = async () => {
    if (!selectedSessionId) return;
    if (confirm('Mulai ulang sesi ini dan hapus riwayat obrolan? Memori penting akan tetap tersimpan.')) {
      await db.chatMessages.where('sessionId').equals(selectedSessionId).delete();
      await db.chatMessages.put({
        id: `msg_${Date.now()}`,
        sessionId: selectedSessionId,
        role: 'assistant',
        content: character.greetingMessage,
        timestamp: Date.now(),
        modelUsed: character.customModel || 'system-greeting',
      });
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full min-h-0 relative overflow-hidden transition-colors ${
      isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
    }`}>
      {/* Top Header */}
      <ChatHeader
        character={character}
        persona={persona}
        onClearSession={handleClearSession}
        searchKeyword={searchKeyword}
        onSearchChange={setSearchKeyword}
        isSearchOpen={isSearchOpen}
        onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
      />

      {/* Message List */}
      <ChatMessageList
        messages={displayedMessages}
        character={character}
        persona={persona}
        onReroll={handleReroll}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
        onSwipeChange={handleSwipeChange}
      />

      {/* Input Box */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onStopGeneration={handleStopGeneration}
        disabled={isGenerating}
      />

      {/* Scenario Drawer */}
      <ScenarioDrawer character={character} persona={persona} />

      {/* Memory Drawer */}
      <MemoryDrawer character={character} persona={persona} />

      {/* Relationship Drawer */}
      <RelationshipDrawer character={character} persona={persona} session={session} />

      {/* Pin Memory Quick Modal */}
      <PinMemoryModal character={character} />
    </div>
  );
}

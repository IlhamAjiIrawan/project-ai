'use client';

import React, { useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { ScenarioDrawer } from './ScenarioDrawer';
import { generateRoleplayResponse } from '@/lib/providers/engine';
import { ChatMessage, ChatSession } from '@/types';
import { Compass, Sparkles } from 'lucide-react';

export function ChatInterface() {
  const {
    selectedCharacterId,
    selectedSessionId,
    setSelectedSessionId,
    selectedPersonaId,
    setActiveView,
    setIsSettingsOpen,
    isGenerating,
    setIsGenerating,
    activeStreamingMessage,
    setActiveStreamingMessage,
    abortController,
    setAbortController,
    settings,
  } = useAppStore();

  const characters = useLiveQuery(() => db.characters.toArray(), []) || [];
  const personas = useLiveQuery(() => db.personas.toArray(), []) || [];

  const character = characters.find((c) => c.id === selectedCharacterId) || characters[0];
  const persona = personas.find((p) => p.id === selectedPersonaId) || personas.find((p) => p.isDefault) || personas[0];

  const messages = useLiveQuery(
    () => (selectedSessionId ? db.chatMessages.where('sessionId').equals(selectedSessionId).sortBy('timestamp') : []),
    [selectedSessionId]
  ) || [];

  // If no session exists for the selected character, create one
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
            title: `Roleplay: ${character.name}`,
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
        <Sparkles className="w-12 h-12 text-cyan-400 animate-bounce" />
        <h3 className="text-lg font-bold text-white">Pilih Karakter untuk Memulai Roleplay</h3>
        <button
          onClick={() => setActiveView('gallery')}
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
        >
          Buka Galeri Karakter
        </button>
      </div>
    );
  }

  // Handle Send Message
  const handleSendMessage = async (text: string) => {
    if (!selectedSessionId || !text.trim() || isGenerating) return;

    // Check if at least one API key is set
    const provider = character.customProvider || settings.defaultProvider;
    const isKeySet =
      (provider === 'gemini' && settings.geminiApiKey) ||
      (provider === 'openrouter' && settings.openRouterApiKey) ||
      (provider === 'groq' && settings.groqApiKey) ||
      (provider === 'openai' && settings.openaiApiKey) ||
      (provider === 'custom' && settings.customBaseUrl);

    if (!isKeySet) {
      setIsSettingsOpen(true);
      alert(`Mohon masukkan API Key untuk provider ${provider.toUpperCase()} di menu Pengaturan terlebih dahulu.`);
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

    // Add user message to DB
    await db.chatMessages.put(userMessage);
    await db.chatSessions.update(selectedSessionId, {
      updatedAt: Date.now(),
      lastMessagePreview: text.substring(0, 60),
    });

    // Start Streaming Generation
    const ac = new AbortController();
    setAbortController(ac);
    setIsGenerating(true);
    setActiveStreamingMessage('');

    try {
      const allMessages = await db.chatMessages.where('sessionId').equals(selectedSessionId).sortBy('timestamp');

      let accumulated = '';
      const finalReply = await generateRoleplayResponse({
        character,
        userPersona: persona,
        chatHistory: allMessages,
        newUserMessage: text,
        settings,
        onChunk: (chunk) => {
          accumulated += chunk;
          setActiveStreamingMessage(accumulated);
        },
        signal: ac.signal,
      });

      // Save assistant message to DB
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
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        alert(`Gagal menghasilkan balasan: ${err.message}`);
      }
    } finally {
      setIsGenerating(false);
      setActiveStreamingMessage('');
      setAbortController(null);
    }
  };

  // Handle Reroll / Swipe Alternative Generation
  const handleReroll = async (messageId: string) => {
    if (!selectedSessionId || isGenerating) return;

    const targetMsg = await db.chatMessages.get(messageId);
    if (!targetMsg || targetMsg.role !== 'assistant') return;

    // Get messages preceding this message
    const allMessages = await db.chatMessages.where('sessionId').equals(selectedSessionId).sortBy('timestamp');
    const targetIdx = allMessages.findIndex((m) => m.id === messageId);
    const precedingHistory = targetIdx > 0 ? allMessages.slice(0, targetIdx) : [];

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
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        alert(`Gagal reroll balasan: ${err.message}`);
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
    if (confirm('Mulai ulang sesi ini dan hapus semua pesan obrolan saat ini?')) {
      await db.chatMessages.where('sessionId').equals(selectedSessionId).delete();
      // Add initial greeting back
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
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] relative overflow-hidden bg-zinc-950">
      {/* Top Header */}
      <ChatHeader character={character} persona={persona} onClearSession={handleClearSession} />

      {/* Message List */}
      <ChatMessageList
        messages={messages}
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
    </div>
  );
}

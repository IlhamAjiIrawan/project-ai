'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { CharacterGallery } from '@/components/CharacterGallery';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { CharacterModal } from '@/components/CharacterModal';
import { PersonaModal } from '@/components/PersonaModal';
import { SettingsModal } from '@/components/SettingsModal';
import { useAppStore } from '@/lib/store';
import { seedDatabaseIfEmpty, db } from '@/lib/db';

export default function Home() {
  const { activeView, setSettings } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      await seedDatabaseIfEmpty();
      const storedSettings = await db.settings.get('global');
      if (storedSettings) {
        setSettings(storedSettings);
      }
      setIsInitialized(true);
    }
    init();
  }, [setSettings]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-500 animate-spin flex items-center justify-center p-0.5">
          <div className="w-full h-full bg-zinc-950 rounded-[14px]" />
        </div>
        <p className="text-xs text-zinc-400 font-mono tracking-wider animate-pulse">
          MEMUAT ROLEPLAY AI HUB...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Dynamic Main Content View */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-zinc-950/40">
          {activeView === 'gallery' && <CharacterGallery />}
          {activeView === 'chat' && <ChatInterface />}
        </main>
      </div>

      {/* Global Modals */}
      <CharacterModal />
      <PersonaModal />
      <SettingsModal />
    </div>
  );
}

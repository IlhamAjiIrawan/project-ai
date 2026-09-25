'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { CharacterModal } from './CharacterModal';
import { PersonaModal } from './PersonaModal';
import { SettingsModal } from './SettingsModal';
import { useAppStore } from '@/lib/store';
import { seedDatabaseIfEmpty, db } from '@/lib/db';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { setSettings } = useAppStore();
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
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-violet-500 animate-spin flex items-center justify-center p-0.5 shadow-lg shadow-cyan-500/20">
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

      {/* Main Workspace Layout with Sidebar & Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Collapsible Sidebar */}
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Dynamic Route Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-zinc-950/40 relative">
          {children}
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <CharacterModal />
      <PersonaModal />
      <SettingsModal />
    </div>
  );
}

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
  const { setSettings, theme } = useAppStore();
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

  useEffect(() => {
    // Apply theme class to document element
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  if (!isInitialized) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center space-y-3 ${theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
        <div className="w-8 h-8 rounded-full border-2 border-zinc-500 border-t-transparent animate-spin" />
        <p className="text-xs text-zinc-500 font-mono tracking-wider">
          MEMUAT APLIKASI...
        </p>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Top Navbar */}
      <Navbar />

      {/* Main Workspace Layout with Sidebar & Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Collapsible Sidebar */}
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Dynamic Route Content */}
        <main className={`flex-1 flex flex-col min-w-0 overflow-hidden relative ${isDark ? 'bg-zinc-950/40' : 'bg-white/60'}`}>
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

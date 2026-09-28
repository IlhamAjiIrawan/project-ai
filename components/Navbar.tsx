'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import {
  Sparkles,
  Bot,
  User,
  Settings,
  Plus,
  Key,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { POPULAR_MODELS } from '@/lib/providers/types';

interface NavbarProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export function Navbar({ sidebarOpen, onToggleSidebar }: NavbarProps) {
  const {
    setIsCharacterModalOpen,
    setEditingCharacter,
    selectedPersonaId,
    setSelectedPersonaId,
    settings,
    theme,
    toggleTheme,
  } = useAppStore();

  const personas = useLiveQuery(() => db.personas.toArray(), []) || [];
  const activePersona = personas.find((p) => p.id === selectedPersonaId) || personas.find((p) => p.isDefault) || personas[0];

  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  // Set default persona if none selected
  useEffect(() => {
    if (!selectedPersonaId && activePersona) {
      setSelectedPersonaId(activePersona.id);
    }
  }, [activePersona, selectedPersonaId, setSelectedPersonaId]);

  const activeModelPreset = POPULAR_MODELS.find(
    (m) => m.provider === settings.defaultProvider && m.id === settings.defaultModel
  );

  const isAnyKeyConfigured =
    Boolean(settings.geminiApiKey) ||
    Boolean(settings.openRouterApiKey) ||
    Boolean(settings.groqApiKey) ||
    Boolean(settings.openaiApiKey) ||
    Boolean(settings.customApiKey);

  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-40 w-full shrink-0 glass-panel border-b px-3 sm:px-6 py-2 flex items-center justify-between transition-colors ${
      isDark ? 'border-zinc-800/80 bg-zinc-950/80' : 'border-zinc-200 bg-white/80'
    }`}>
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-2 sm:gap-6">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? "Tutup Menu" : "Buka Menu"}
            className={`p-2 rounded-lg border md:hidden transition-colors cursor-pointer ${
              isDark
                ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800'
                : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100'
            }`}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}

        <Link
          href="/"
          className="flex items-center gap-2 group text-left cursor-pointer focus:outline-none"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isDark ? 'bg-zinc-800 text-zinc-100 group-hover:bg-zinc-700' : 'bg-zinc-900 text-zinc-50 group-hover:bg-zinc-800'
          }`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold tracking-tight text-sm sm:text-base">
                Roleplay AI
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-2">
        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
          className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
            isDark
              ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800'
              : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100'
          }`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Create Character Quick Button */}
        <button
          onClick={() => {
            setEditingCharacter(null);
            setIsCharacterModalOpen(true);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            isDark
              ? 'bg-zinc-100 text-zinc-950 hover:bg-white'
              : 'bg-zinc-900 text-white hover:bg-zinc-800'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Karakter Baru</span>
        </button>

        {/* Persona Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              isDark
                ? 'border-zinc-800 bg-zinc-900/90 text-zinc-200 hover:bg-zinc-800'
                : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50'
            }`}
            title="Ganti Persona Pemain"
          >
            {activePersona?.avatar ? (
              <img
                src={activePersona.avatar}
                alt={activePersona.name}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <User className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span className="max-w-[85px] truncate hidden sm:inline font-medium text-xs">
              {activePersona?.name || 'Persona'}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {personaDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setPersonaDropdownOpen(false)}
              />
              <div className={`absolute right-0 mt-2 w-56 rounded-xl p-1.5 shadow-xl z-50 border ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
              }`}>
              <div className={`px-2 py-1.5 border-b flex items-center justify-between ${
                isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-100 text-zinc-500'
              }`}>
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  Persona Pemain
                </span>
                <Link
                  href="/personas"
                  onClick={() => setPersonaDropdownOpen(false)}
                  className="text-[10px] text-zinc-400 hover:text-zinc-100 hover:underline cursor-pointer"
                >
                  Kelola
                </Link>
              </div>

              <div className="py-1 space-y-0.5 max-h-48 overflow-y-auto">
                {personas.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => {
                      setSelectedPersonaId(persona.id);
                      setPersonaDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      selectedPersonaId === persona.id
                        ? isDark ? 'bg-zinc-800 font-medium' : 'bg-zinc-100 font-medium'
                        : isDark ? 'hover:bg-zinc-800/60 text-zinc-300' : 'hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    {persona.avatar ? (
                      <img
                        src={persona.avatar}
                        alt={persona.name}
                        className="w-5 h-5 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-zinc-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-xs">{persona.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            </>
          )}
        </div>

        {/* Settings / API Key Indicator */}
        <Link
          href="/settings"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
            isAnyKeyConfigured
              ? isDark
                ? 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950'
              : isDark
                ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                : 'border-zinc-200 bg-zinc-50 text-zinc-500 hover:text-zinc-800'
          }`}
          title="Pengaturan API & Model"
        >
          {isAnyKeyConfigured ? (
            <Bot className="w-3.5 h-3.5 text-zinc-400" />
          ) : (
            <Key className="w-3.5 h-3.5 text-zinc-400" />
          )}
          <span className="hidden xl:inline font-mono text-[11px]">
            {activeModelPreset ? activeModelPreset.name : settings.defaultModel || settings.defaultProvider}
          </span>
          <Settings className="w-3.5 h-3.5 text-zinc-400" />
        </Link>
      </div>
    </header>
  );
}

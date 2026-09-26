'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import {
  Sparkles,
  Bot,
  User,
  Settings,
  Plus,
  Compass,
  MessageSquare,
  Key,
  ChevronDown,
  Users,
  SlidersHorizontal,
} from 'lucide-react';
import { POPULAR_MODELS } from '@/lib/providers/types';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    setIsSettingsOpen,
    setIsCharacterModalOpen,
    setIsPersonaModalOpen,
    setEditingCharacter,
    selectedPersonaId,
    setSelectedPersonaId,
    settings,
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

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Compass },
    { href: '/chat', label: 'Ruang Chat', icon: MessageSquare },
    { href: '/characters', label: 'Studio Karakter', icon: Sparkles },
    { href: '/personas', label: 'Persona Pemain', icon: Users },
    { href: '/settings', label: 'Pengaturan API', icon: SlidersHorizontal },
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-3 sm:px-5 py-2.5 flex items-center justify-between">
      {/* Brand & Mode Switcher */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 group text-left cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-violet-500 to-fuchsia-500 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-sm sm:text-base bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400 bg-clip-text text-transparent">
                Roleplay AI Hub
              </span>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                v2.5
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 hidden lg:block">Multi-Provider AI Story Engine</p>
          </div>
        </Link>

        {/* View Switch / Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 ml-2 bg-zinc-900/60 p-1 rounded-xl border border-white/5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Create Character Quick Button */}
        <button
          onClick={() => {
            setEditingCharacter(null);
            setIsCharacterModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-medium shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Buat Karakter</span>
        </button>

        {/* Persona Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-white/10 text-xs text-zinc-200 transition-all cursor-pointer"
            title="Ganti Persona Pemain"
          >
            {activePersona?.avatar ? (
              <img
                src={activePersona.avatar}
                alt={activePersona.name}
                className="w-5 h-5 rounded-full object-cover ring-1 ring-cyan-500/40"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-[10px] font-bold">
                <User className="w-3 h-3" />
              </div>
            )}
            <span className="max-w-[90px] truncate hidden sm:inline font-medium text-xs">
              {activePersona?.name || 'Persona'}
            </span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {personaDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 border border-white/10">
              <div className="px-2.5 py-1.5 border-b border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Persona Pemain
                </span>
                <Link
                  href="/personas"
                  onClick={() => setPersonaDropdownOpen(false)}
                  className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                >
                  Kelola Semua
                </Link>
              </div>

              <div className="py-1 space-y-1 max-h-48 overflow-y-auto">
                {personas.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => {
                      setSelectedPersonaId(persona.id);
                      setPersonaDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                      selectedPersonaId === persona.id
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        : 'text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    {persona.avatar ? (
                      <img
                        src={persona.avatar}
                        alt={persona.name}
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{persona.name}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{persona.bio}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Model / Provider Indicator with direct link / modal */}
        <Link
          href="/settings"
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
            isAnyKeyConfigured
              ? 'bg-zinc-900/80 border-white/10 text-zinc-300 hover:border-cyan-500/40 hover:text-cyan-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 animate-pulse'
          }`}
          title="Pengaturan API & Provider"
        >
          {isAnyKeyConfigured ? (
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <Key className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="hidden xl:inline font-mono text-[11px]">
            {activeModelPreset ? activeModelPreset.name : settings.defaultModel || settings.defaultProvider}
          </span>
          <Settings className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
        </Link>
      </div>
    </header>
  );
}

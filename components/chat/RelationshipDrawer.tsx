'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/db';
import { Character, ChatSession, UserPersona } from '@/types';
import {
  X,
  Heart,
  Sparkles,
  Sliders,
  Check,
  ChevronRight,
  Shield,
  Crown,
  Lock,
  Unlock,
} from 'lucide-react';
import { RELATIONSHIP_TIERS, getRelationshipTier } from '@/lib/relationship';

interface RelationshipDrawerProps {
  character: Character;
  persona?: UserPersona;
  session?: ChatSession | null;
}

export function RelationshipDrawer({ character, persona, session }: RelationshipDrawerProps) {
  const { isRelationshipDrawerOpen, setIsRelationshipDrawerOpen, selectedSessionId, theme } = useAppStore();

  const currentLevel = session?.affinityLevel || 1;
  const currentExp = session?.affinityExp || 0;
  const tier = getRelationshipTier(currentLevel);

  const [sliderLevel, setSliderLevel] = useState(currentLevel);
  const [isSaved, setIsSaved] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    setSliderLevel(currentLevel);
  }, [currentLevel, isRelationshipDrawerOpen]);

  if (!isRelationshipDrawerOpen) return null;

  const handleSaveLevel = async (newLevelValue: number) => {
    if (!selectedSessionId) return;
    const safeLevel = Math.max(1, Math.min(100, Math.floor(newLevelValue)));
    const newTier = getRelationshipTier(safeLevel);

    await db.chatSessions.update(selectedSessionId, {
      affinityLevel: safeLevel,
      affinityExp: safeLevel === 100 ? 100 : 0,
      relationshipTitle: newTier.title,
      updatedAt: Date.now(),
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const previewTier = getRelationshipTier(sliderLevel);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`w-full max-w-md h-full flex flex-col shadow-2xl border-l transition-colors ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-zinc-800' : 'border-zinc-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-zinc-900 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Status & Tingkatan Hubungan</h3>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Kedekatan emosional antara {persona?.name || 'Kamu'} & {character.name}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsRelationshipDrawerOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Current Level Card */}
          <div className={`p-4 rounded-2xl border bg-gradient-to-br space-y-3 relative overflow-hidden ${tier.bgGradient} ${
            isDark ? 'border-zinc-800' : 'border-zinc-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${tier.badgeColor}`}>
                {tier.emoji} {tier.title}
              </span>
              <span className="text-xs font-bold font-mono">
                Level <span className="text-base text-rose-400">{currentLevel}</span>/100
              </span>
            </div>

            <div>
              <h4 className="font-bold text-sm sm:text-base">{tier.title}</h4>
              <p className={`text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{tier.subTitle}</p>
            </div>

            {/* EXP Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>Progress ke Level Berikutnya</span>
                <span>{currentLevel >= 100 ? 'Level Maksimal' : `${currentExp}/100 EXP`}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                  style={{ width: `${currentLevel >= 100 ? 100 : currentExp}%` }}
                />
              </div>
            </div>
          </div>

          {/* Current Attitude & Behavior Directive */}
          <div className={`p-3.5 rounded-xl border space-y-2 ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <h5 className="font-semibold text-xs flex items-center gap-1.5 text-zinc-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Sikap {character.name} Saat Ini:</span>
            </h5>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              {tier.behaviorPrompt.replace(/\{\{char\}\}/gi, character.name).replace(/\{\{user\}\}/gi, persona?.name || 'Kamu')}
            </p>
          </div>

          {/* Manual Level Adjuster */}
          <div className={`p-3.5 rounded-xl border space-y-3 ${
            isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                <span>Atur Level Hubungan Manual</span>
              </div>
              <span className="font-mono text-xs font-bold text-rose-400">
                Lv. {sliderLevel} ({previewTier.title})
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={sliderLevel}
              onChange={(e) => setSliderLevel(parseInt(e.target.value))}
              className="w-full cursor-pointer accent-rose-500"
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Geser untuk langsung mulai roleplay sebagai Pacar, Suami/Istri, atau Sahabat.
              </p>

              <button
                type="button"
                onClick={() => handleSaveLevel(sliderLevel)}
                disabled={sliderLevel === currentLevel && !isSaved}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                  isSaved
                    ? 'bg-emerald-600 text-white'
                    : sliderLevel !== currentLevel
                    ? isDark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                    : 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersimpan</span>
                  </>
                ) : (
                  <span>Terapkan</span>
                )}
              </button>
            </div>
          </div>

          {/* 9 Stages Milestone Roadmap */}
          <div className="space-y-2 pt-2">
            <h5 className="font-bold text-xs uppercase tracking-wider text-zinc-400">
              Peta Tingkatan Hubungan (1 - 100)
            </h5>

            <div className="space-y-2">
              {RELATIONSHIP_TIERS.map((t) => {
                const isCurrent = currentLevel >= t.minLevel && currentLevel <= t.maxLevel;
                const isUnlocked = currentLevel >= t.minLevel;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSliderLevel(t.minLevel)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isCurrent
                        ? isDark ? 'bg-zinc-900 border-rose-500/50 shadow-sm' : 'bg-rose-50/50 border-rose-300 shadow-xs'
                        : isUnlocked
                        ? isDark ? 'bg-zinc-900/40 border-zinc-800/80 opacity-90 hover:border-zinc-700' : 'bg-white border-zinc-200 opacity-90 hover:border-zinc-300'
                        : isDark ? 'bg-zinc-950 border-zinc-900 opacity-40 hover:opacity-60' : 'bg-zinc-50 border-zinc-200 opacity-40 hover:opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{t.emoji}</span>
                        <div>
                          <p className={`font-semibold text-xs ${isCurrent ? 'text-rose-400 font-bold' : ''}`}>
                            {t.title}
                          </p>
                          <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            {t.subTitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-right">
                        <span className="font-mono text-[10px] text-zinc-400">
                          Lv. {t.minLevel}–{t.maxLevel}
                        </span>
                        {isCurrent ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500 text-white">
                            Aktif
                          </span>
                        ) : isUnlocked ? (
                          <Unlock className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Lock className="w-3 h-3 text-zinc-600" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

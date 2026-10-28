'use client';

import React, { useState, useEffect } from 'react';
import { Character, ChatSession, UserPersona } from '@/types';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/db';
import { X, BookOpen, User, Bot, MapPin, Sliders, Edit3, RotateCcw, Clock, Sparkles, Check } from 'lucide-react';

interface ScenarioDrawerProps {
  character: Character;
  persona?: UserPersona;
  session?: ChatSession | null;
}

const LOCATION_PRESETS = [
  'Restoran Mewah',
  'Kafe Santai',
  'Taman Kota',
  'Ruang Kantor',
  'Kamar Pribadi',
  'Pusat Perbelanjaan',
  'Markas Rahasia',
];

const TIME_PRESETS = [
  'Malam hari',
  'Larut malam',
  'Sore menjelang senja',
  'Pagi cerah',
  'Hujan gerimis malam',
  'Tengah malam sunyi',
];

export function ScenarioDrawer({ character, persona, session }: ScenarioDrawerProps) {
  const { isScenarioDrawerOpen, setIsScenarioDrawerOpen, setEditingCharacter, setIsCharacterModalOpen, theme } = useAppStore();
  const isDark = theme === 'dark';

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [inputLocation, setInputLocation] = useState('');
  const [inputTime, setInputTime] = useState('');
  const [inputNotes, setInputNotes] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  useEffect(() => {
    if (session) {
      setInputLocation(session.currentLocation || '');
      setInputTime(session.currentTime || '');
      setInputNotes(session.sceneNotes || '');
    }
  }, [session?.currentLocation, session?.currentTime, session?.sceneNotes, session?.id]);

  if (!isScenarioDrawerOpen) return null;

  const hasDynamicLocation = Boolean(session?.currentLocation && session.currentLocation.trim());

  const handleSaveLocation = async () => {
    if (!session?.id) return;
    const loc = inputLocation.trim();
    const time = inputTime.trim();
    const notes = inputNotes.trim();

    await db.chatSessions.update(session.id, {
      currentLocation: loc,
      currentTime: time,
      sceneNotes: notes,
      updatedAt: Date.now(),
    });

    setIsEditingLocation(false);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  const handleResetToDefaultScenario = async () => {
    if (!session?.id) return;
    if (confirm('Kembalikan latar tempat ke Skenario Pembuka Karakter bawaan?')) {
      await db.chatSessions.update(session.id, {
        currentLocation: '',
        currentTime: '',
        sceneNotes: '',
        updatedAt: Date.now(),
      });
      setInputLocation('');
      setInputTime('');
      setInputNotes('');
      setIsEditingLocation(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div
        className="absolute inset-0"
        onClick={() => setIsScenarioDrawerOpen(false)}
      />

      <div className={`relative z-10 w-full sm:w-88 h-full border-l flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 transition-colors ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-xs sm:text-sm">Skenario & Lokasi Adegan</h3>
          </div>
          <button
            onClick={() => setIsScenarioDrawerOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Character Card Info */}
          <div className={`p-3 rounded-xl border space-y-2 ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {character.avatar ? (
                <img
                  src={character.avatar}
                  alt={character.name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                  isDark ? 'bg-zinc-800' : 'bg-zinc-200'
                }`}>
                  <Bot className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <h4 className="font-semibold truncate">{character.name}</h4>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium uppercase tracking-wider ${
                  isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600'
                }`}>
                  {character.category}
                </span>
              </div>
            </div>
            <p className={`leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {character.description || character.tagline}
            </p>
          </div>

          {/* DYNAMIC SCENE & LOCATION STATE SECTION */}
          <div className={`p-3.5 rounded-xl border space-y-3 transition-colors ${
            hasDynamicLocation
              ? isDark ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-emerald-50/70 border-emerald-300'
              : isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold">
                <MapPin className={`w-3.5 h-3.5 ${hasDynamicLocation ? 'text-emerald-400' : 'text-zinc-400'}`} />
                <span className={hasDynamicLocation ? 'text-emerald-400 font-bold' : 'text-zinc-300'}>
                  Lokasi & Waktu Terkini (Aktif)
                </span>
              </div>
              {hasDynamicLocation && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                  isDark ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-200 text-emerald-900'
                }`}>
                  Berpindah
                </span>
              )}
            </div>

            {/* Active Display Mode */}
            {!isEditingLocation ? (
              <div className="space-y-2">
                {hasDynamicLocation ? (
                  <div className="space-y-1.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-semibold text-zinc-400 text-[11px]">Tempat:</span>
                      <span className="font-medium text-xs text-emerald-300">{session?.currentLocation}</span>
                    </div>
                    {session?.currentTime && (
                      <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                        <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{session.currentTime}</span>
                      </div>
                    )}
                    {session?.sceneNotes && (
                      <p className={`text-[11px] italic pt-1 border-t ${
                        isDark ? 'border-emerald-500/20 text-zinc-400' : 'border-emerald-200 text-zinc-600'
                      }`}>
                        "{session.sceneNotes}"
                      </p>
                    )}
                  </div>
                ) : (
                  <p className={`leading-relaxed text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Saat ini masih menggunakan <strong>Skenario Pembuka Karakter</strong>. Klik tombol di bawah untuk berpindah tempat secara manual atau biarkan AI mendeteksinya otomatis.
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setIsEditingLocation(true)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      hasDynamicLocation
                        ? isDark ? 'bg-emerald-900/50 hover:bg-emerald-800/60 border-emerald-500/40 text-emerald-200' : 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-900'
                        : isDark ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{hasDynamicLocation ? 'Ubah Latar Tempat' : '+ Pindah Lokasi / Waktu'}</span>
                  </button>

                  {hasDynamicLocation && (
                    <button
                      onClick={handleResetToDefaultScenario}
                      title="Kembalikan ke Skenario Pembuka Awal Karakter"
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isDark ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'border-zinc-200 hover:bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {saveSuccessNotice && (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] pt-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Latar tempat berhasil disimpan & aktif!</span>
                  </div>
                )}
              </div>
            ) : (
              /* Inline Edit Mode */
              <div className="space-y-3 pt-1 border-t border-zinc-800/60">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Nama Lokasi Terkini
                  </label>
                  <input
                    type="text"
                    value={inputLocation}
                    onChange={(e) => setInputLocation(e.target.value)}
                    placeholder="Contoh: Restoran Kivotos, Kafe Sakura, Taman Kota..."
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-emerald-500' : 'bg-white border-zinc-300 text-zinc-900 focus:border-emerald-600'
                    }`}
                  />
                  {/* Location Presets */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {LOCATION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setInputLocation(preset)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          inputLocation === preset
                            ? 'bg-emerald-600 text-white border-emerald-500 font-semibold'
                            : isDark ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Waktu / Suasana Latar
                  </label>
                  <input
                    type="text"
                    value={inputTime}
                    onChange={(e) => setInputTime(e.target.value)}
                    placeholder="Contoh: Malam hari, Larut malam, Hujan deras..."
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-emerald-500' : 'bg-white border-zinc-300 text-zinc-900 focus:border-emerald-600'
                    }`}
                  />
                  {/* Time Presets */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {TIME_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setInputTime(preset)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          inputTime === preset
                            ? 'bg-emerald-600 text-white border-emerald-500 font-semibold'
                            : isDark ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Detail Adegan / Catatan Suasana (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={inputNotes}
                    onChange={(e) => setInputNotes(e.target.value)}
                    placeholder="Contoh: Duduk berdua di meja sudut dekat jendela, menikmati makan malam hangat."
                    className={`w-full px-2.5 py-1.5 rounded-lg border text-xs resize-none ${
                      isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-emerald-500' : 'bg-white border-zinc-300 text-zinc-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveLocation}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors cursor-pointer"
                  >
                    Simpan Latar Baru
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingLocation(false);
                      if (session) {
                        setInputLocation(session.currentLocation || '');
                        setInputTime(session.currentTime || '');
                        setInputNotes(session.sceneNotes || '');
                      }
                    }}
                    className={`py-1.5 px-3 rounded-lg border text-xs cursor-pointer ${
                      isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-zinc-300 hover:bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    Batal
                  </button>
                </div>

                <p className={`text-[10px] leading-tight ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  💡 <em>Lokasi & waktu ini diprioritaskan di atas skenario awal, mencegah AI lupa dan kembali ke tempat pembuka saat obrolan berlangsung lama.</em>
                </p>
              </div>
            )}
          </div>

          {/* Initial Default Scenario Reference */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-zinc-400 font-semibold">
              <div className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Skenario Pembuka Karakter</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                hasDynamicLocation
                  ? isDark ? 'text-zinc-500 bg-zinc-900' : 'text-zinc-400 bg-zinc-100'
                  : 'text-emerald-400 bg-emerald-500/10'
              }`}>
                {hasDynamicLocation ? 'Digantikan Lokasi Terkini' : 'Aktif Bawaan'}
              </span>
            </div>
            <div className={`p-2.5 rounded-xl border leading-relaxed ${
              hasDynamicLocation
                ? isDark ? 'bg-zinc-900/20 border-zinc-800/60 text-zinc-400 line-through/20 opacity-80' : 'bg-zinc-50/50 border-zinc-200 text-zinc-500'
                : isDark ? 'bg-zinc-900/40 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
            }`}>
              {character.scenario || 'Tidak ada skenario spesifik yang diatur.'}
            </div>
          </div>

          {/* Active Player Persona */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 font-semibold text-zinc-400">
              <User className="w-3.5 h-3.5" />
              <span>Persona Pemain</span>
            </div>
            <div className={`p-2.5 rounded-xl border space-y-1 ${
              isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <p className="font-semibold">{persona?.name || 'User'}</p>
              <p className={`leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {persona?.bio || 'Petualang misterius tanpa bio.'}
              </p>
            </div>
          </div>

          {/* Lorebook Entries */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-zinc-400">
              <span>Memori Lorebook ({character.lorebook?.length || 0})</span>
            </div>

            {(!character.lorebook || character.lorebook.length === 0) ? (
              <p className={`italic ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Belum ada memori lorebook.
              </p>
            ) : (
              <div className="space-y-2">
                {character.lorebook.map((entry, i) => (
                  <div key={entry.id || i} className={`p-2 rounded-lg border space-y-1 ${
                    isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <div className="flex flex-wrap gap-1">
                      {entry.keys.map((k, kIdx) => (
                        <span key={kIdx} className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                          isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-700'
                        }`}>
                          #{k}
                        </span>
                      ))}
                    </div>
                    <p className={`leading-snug ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{entry.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit Character shortcut */}
          <div className="pt-2">
            <button
              onClick={() => {
                setIsScenarioDrawerOpen(false);
                setEditingCharacter(character);
                setIsCharacterModalOpen(true);
              }}
              className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit Karakter di Studio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/db';
import { ChatSession, Character } from '@/types';
import { X, Clapperboard, Sparkles, Check, Flame, Zap, ShieldAlert, Heart, CloudRain } from 'lucide-react';

interface AuthorsNoteDrawerProps {
  session?: ChatSession;
  character: Character;
}

const PRESET_PLOT_IDEAS = [
  {
    label: 'Listrik Padam & Bahaya',
    icon: Zap,
    text: 'Tiba-tiba lampu dan aliran listrik padam total. Terdengar suara langkah mencurigakan dan decitan pintu yang dibuka paksa di dekat kita.',
  },
  {
    label: 'Hujan Deras & Terjebak',
    icon: CloudRain,
    text: 'Hujan badai lebat tiba-tiba turun mengguyur tempat ini, membuat kita harus berteduh rapat dan terjebak berdua lebih lama.',
  },
  {
    label: 'Momen Manis Canggung',
    icon: Heart,
    text: '{{char}} tidak sengaja tersandung atau berada sangat dekat dengan {{user}}, membuat suasana menjadi sangat canggung dan deg-degan.',
  },
  {
    label: 'Karakter Curiga',
    icon: ShieldAlert,
    text: '{{char}} memperhatikan gerak-gerik {{user}} yang mencurigakan dan mulai menanyakan apa yang sebenarnya disembunyikan oleh {{user}}.',
  },
  {
    label: 'Musuh / Monster Menyerang',
    icon: Flame,
    text: 'Gerombolan musuh tak terduga muncul mengepung area ini, memicu situasi pertempuran genting yang menuntut tindakan cepat.',
  },
];

export function AuthorsNoteDrawer({ session, character }: AuthorsNoteDrawerProps) {
  const { isAuthorsNoteDrawerOpen, setIsAuthorsNoteDrawerOpen, theme } = useAppStore();
  const isDark = theme === 'dark';

  const [note, setNote] = useState(session?.authorsNote || '');
  const [enabled, setEnabled] = useState(session?.authorsNoteEnabled ?? false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session) {
      setNote(session.authorsNote || '');
      setEnabled(session.authorsNoteEnabled ?? false);
    }
  }, [session?.id, session?.authorsNote, session?.authorsNoteEnabled]);

  if (!isAuthorsNoteDrawerOpen || !session) return null;

  const handleSave = async () => {
    await db.chatSessions.update(session.id, {
      authorsNote: note.trim(),
      authorsNoteEnabled: enabled,
      updatedAt: Date.now(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleToggle = async (newVal: boolean) => {
    setEnabled(newVal);
    await db.chatSessions.update(session.id, {
      authorsNote: note.trim(),
      authorsNoteEnabled: newVal,
      updatedAt: Date.now(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleApplyPreset = (presetText: string) => {
    setNote(presetText);
    setEnabled(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div
        className="absolute inset-0"
        onClick={() => setIsAuthorsNoteDrawerOpen(false)}
      />

      <div
        className={`relative z-10 w-full sm:w-88 h-full border-l flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 transition-colors ${
          isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clapperboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs sm:text-sm flex items-center gap-1.5">
                Pengarah Plot / Author&apos;s Note
              </h3>
              <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Panduan situasi & arah adegan untuk AI
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthorsNoteDrawerOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Active Status Toggle */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
              enabled
                ? 'bg-indigo-500/10 border-indigo-500/30'
                : isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="space-y-0.5">
              <div className="font-medium text-xs flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    enabled ? 'bg-indigo-400 animate-pulse' : isDark ? 'bg-zinc-600' : 'bg-zinc-400'
                  }`}
                />
                Status Pengarah Plot
              </div>
              <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {enabled ? 'Aktif disuntikkan ke setiap balasan' : 'Nonaktif (Diabaikan sementara)'}
              </p>
            </div>
            <button
              onClick={() => handleToggle(!enabled)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enabled ? 'bg-indigo-600' : isDark ? 'bg-zinc-800' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  enabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Textarea Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-zinc-400 font-medium text-[11px]">
              <span>Instruksi Kejadian / Catatan Sutradara</span>
              <span className="text-[10px] font-mono">{note.length}/300</span>
            </div>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Tiba-tiba terdengar suara ledakan dari kejauhan, atau {{char}} mulai merasakan kehangatan saat memegang tangan {{user}}..."
              className={`w-full p-3 rounded-xl text-xs font-sans resize-none border leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                isDark
                  ? 'bg-zinc-900/80 border-zinc-800 text-zinc-100 placeholder:text-zinc-600'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
              }`}
            />
            <p className={`text-[10px] leading-relaxed ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Gunakan <code className="text-indigo-400">{`{{char}}`}</code> untuk nama karakter ({character.name}) dan{' '}
              <code className="text-indigo-400">{`{{user}}`}</code> untuk nama pemain.
            </p>
          </div>

          {/* Quick Preset Ideas */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-[11px] font-medium text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Inspirasi Kejadian Cepat (Klik untuk Pasang)</span>
            </div>
            <div className="space-y-1.5">
              {PRESET_PLOT_IDEAS.map((idea, idx) => {
                const Icon = idea.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleApplyPreset(idea.text)}
                    className={`w-full text-left p-2.5 rounded-xl border flex items-start gap-2.5 transition-all cursor-pointer ${
                      isDark
                        ? 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-800/60 hover:border-zinc-700 text-zinc-300'
                        : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[11px]">{idea.label}</div>
                      <div className={`text-[10px] truncate ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {idea.text}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info Card */}
          <div
            className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
              isDark ? 'bg-zinc-900/30 border-zinc-800/60 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
            }`}
          >
            💡 <strong className="text-zinc-300">Cara Kerja:</strong> Catatan ini diinjeksikan langsung ke dalam instruksi
            sistem AI dengan prioritas tinggi. AI akan mengadaptasi adegan berikutnya sesuai arahan ini tanpa mengorbankan
            kepribadian aslinya.
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-4 border-t flex items-center justify-end gap-2 ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
          <button
            onClick={() => setIsAuthorsNoteDrawerOpen(false)}
            className="px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-100 cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md ${
              saved
                ? 'bg-emerald-600 text-white'
                : isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Tersimpan!
              </>
            ) : (
              <>
                <Clapperboard className="w-3.5 h-3.5" />
                Simpan Arahan Plot
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import { UserPersona } from '@/types';
import {
  Users,
  Plus,
  UserCheck,
  Edit3,
  Trash2,
  Sparkles,
  Save,
  CheckCircle,
  X,
} from 'lucide-react';

const PRESET_USER_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80',
];

export default function PersonasStudioPage() {
  const { selectedPersonaId, setSelectedPersonaId } = useAppStore();
  const personas = useLiveQuery(() => db.personas.toArray(), []) || [];

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');

  const startCreate = () => {
    setName('');
    setAvatar(PRESET_USER_AVATARS[0]);
    setBio('');
    setEditingId(null);
    setIsEditing(true);
  };

  const startEdit = (persona: UserPersona) => {
    setName(persona.name);
    setAvatar(persona.avatar);
    setBio(persona.bio);
    setEditingId(persona.id);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Nama persona tidak boleh kosong.');
      return;
    }

    if (editingId) {
      await db.personas.update(editingId, {
        name: name.trim(),
        avatar: avatar.trim() || PRESET_USER_AVATARS[0],
        bio: bio.trim(),
      });
    } else {
      const newPersona: UserPersona = {
        id: `persona_${Date.now()}`,
        name: name.trim(),
        avatar: avatar.trim() || PRESET_USER_AVATARS[0],
        bio: bio.trim(),
        isDefault: personas.length === 0,
        createdAt: Date.now(),
      };
      await db.personas.put(newPersona);
      setSelectedPersonaId(newPersona.id);
    }

    setIsEditing(false);
    setEditingId(null);
  };

  const handleSetDefault = async (id: string) => {
    for (const p of personas) {
      await db.personas.update(p.id, { isDefault: p.id === id });
    }
    setSelectedPersonaId(id);
  };

  const handleDelete = async (id: string) => {
    if (personas.length <= 1) {
      alert('Kamu harus memiliki minimal satu persona pemain.');
      return;
    }
    if (confirm('Hapus profil persona ini?')) {
      await db.personas.delete(id);
      if (selectedPersonaId === id) {
        const remaining = personas.filter((p) => p.id !== id);
        setSelectedPersonaId(remaining[0]?.id || null);
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-7 max-w-5xl mx-auto w-full">
      {/* Studio Header Banner */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
              <Users className="w-3.5 h-3.5 text-violet-400" />
              <span>Player Profiles & Roleplay Aliases</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Studio Persona Pemain
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Atur identitas, nama, avatar, dan deskripsi kepribadianmu yang akan dibaca oleh karakter AI saat berinteraksi.
            </p>
          </div>

          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-semibold text-xs md:text-sm shadow-lg shadow-violet-500/20 transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Persona Baru</span>
          </button>
        </div>
      </div>

      {/* Persona Creator / Editor Form Card (When Active) */}
      {isEditing && (
        <div className="glass-card rounded-3xl p-6 border border-cyan-500/30 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{editingId ? 'Edit Profil Persona' : 'Buat Profil Persona Baru'}</span>
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Avatar Selector */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300">Avatar Profil</label>
              <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-white/5">
                <img
                  src={avatar || PRESET_USER_AVATARS[0]}
                  alt="Avatar Preview"
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-cyan-400/40 shadow-md"
                />

                <div className="w-full space-y-2">
                  <span className="text-[11px] text-zinc-400 block text-center">Pilih Avatar Cepat:</span>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {PRESET_USER_AVATARS.map((avUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatar(avUrl)}
                        className={`w-7 h-7 rounded-full overflow-hidden ring-2 transition-all cursor-pointer ${
                          avatar === avUrl ? 'ring-cyan-400 scale-110' : 'ring-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={avUrl} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="Atau masukkan URL gambar avatar..."
                    className="w-full px-3 py-1.5 rounded-xl glass-input text-xs mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Persona Details */}
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Nama Persona <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Alex / Detektif Morgan / Ryu"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs sm:text-sm font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Deskripsi / Bio & Sifat Persona (User Prompt)
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Deskripsikan latar belakang, kepribadian, penampilan, atau peranmu dalam roleplay. Informasi ini akan diinfokan ke AI agar memahami siapa kamu..."
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs sm:text-sm leading-relaxed"
                />
                <p className="text-[11px] text-zinc-400">
                  AI akan menyesuaikan respon dan panggilan terhadapmu berdasarkan bio persona ini.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Persona</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persona Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personas.map((persona) => {
          const isActive = selectedPersonaId === persona.id;
          return (
            <div
              key={persona.id}
              className={`glass-card p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                isActive
                  ? 'border-cyan-500/50 bg-zinc-900/90 shadow-xl shadow-cyan-500/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <img
                    src={persona.avatar}
                    alt={persona.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-cyan-500/30 shadow-md"
                  />
                  {persona.isDefault && (
                    <span
                      title="Persona Default"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cyan-500 text-zinc-950 flex items-center justify-center ring-2 ring-zinc-950"
                    >
                      <UserCheck className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-white truncate">{persona.name}</h3>
                    {persona.isDefault && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed line-clamp-3">
                    {persona.bio || 'Tidak ada deskripsi bio.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPersonaId(persona.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {isActive ? 'Sedang Dipakai' : 'Pilih Persona Ini'}
                  </button>

                  {!persona.isDefault && (
                    <button
                      onClick={() => handleSetDefault(persona.id)}
                      className="text-[11px] text-zinc-400 hover:text-white cursor-pointer hover:underline"
                    >
                      Jadikan Default
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(persona)}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Edit Persona"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(persona.id)}
                    className="p-1.5 rounded-xl hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Hapus Persona"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

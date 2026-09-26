'use client';

import React, { useState, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { UserPersona } from '@/types';
import { X, UserCheck, Plus, Trash2, Edit3, Save, Upload, Camera, Loader2 } from 'lucide-react';
import { processImageFile } from '@/lib/utils';

const PRESET_USER_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

export function PersonaModal() {
  const { isPersonaModalOpen, setIsPersonaModalOpen, selectedPersonaId, setSelectedPersonaId, theme } = useAppStore();
  const personas = useLiveQuery(() => db.personas.toArray(), []) || [];

  const [isEditingNew, setIsEditingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const personaFileRef = useRef<HTMLInputElement>(null);

  const handlePersonaFile = async (file?: File) => {
    if (!file) return;
    try {
      setIsUploading(true);
      const dataUrl = await processImageFile(file, 256, 0.85);
      setAvatar(dataUrl);
    } catch (err: any) {
      alert(err?.message || 'Gagal memproses gambar persona.');
    } finally {
      setIsUploading(false);
    }
  };



  const isDark = theme === 'dark';

  if (!isPersonaModalOpen) return null;

  const startCreate = () => {
    setName('');
    setAvatar(PRESET_USER_AVATARS[0]);
    setBio('');
    setEditingId(null);
    setIsEditingNew(true);
  };

  const startEdit = (persona: UserPersona) => {
    setName(persona.name);
    setAvatar(persona.avatar);
    setBio(persona.bio);
    setEditingId(persona.id);
    setIsEditingNew(true);
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

    setIsEditingNew(false);
    setEditingId(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`relative w-full max-w-xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border transition-colors ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
          <div>
            <h2 className="text-base sm:text-lg font-bold">Persona Pemain</h2>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Profil dan identitas pemain saat berinteraksi dengan AI
            </p>
          </div>
          <button
            onClick={() => setIsPersonaModalOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          {isEditingNew ? (
            <div className={`p-4 rounded-xl border space-y-3.5 ${
              isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <h3 className="text-xs font-semibold">
                {editingId ? 'Edit Profil Persona' : 'Buat Persona Baru'}
              </h3>

              <div>
                <label className="block text-xs font-semibold mb-1">Nama Pemain</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Alex, Detektif Morgan"
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Deskripsi / Bio Persona</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Seorang petualang yang bersenjatakan pedang sihir..."
                  className={`w-full px-3 py-2 rounded-xl border resize-none ${
                    isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold">Avatar Persona</label>
                  <button
                    type="button"
                    onClick={() => personaFileRef.current?.click()}
                    disabled={isUploading}
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Foto</span>
                  </button>
                </div>

                <input
                  ref={personaFileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePersonaFile(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    onClick={() => personaFileRef.current?.click()}
                    className="relative group w-10 h-10 rounded-full overflow-hidden border border-zinc-700 shrink-0 cursor-pointer flex items-center justify-center bg-zinc-800"
                    title="Klik untuk upload foto persona"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                    ) : (
                      <>
                        <img
                          src={avatar || PRESET_USER_AVATARS[0]}
                          alt="avatar"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Camera className="w-3.5 h-3.5" />
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="URL gambar atau upload..."
                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs border ${
                      isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  {PRESET_USER_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`w-7 h-7 rounded-full overflow-hidden border transition-all cursor-pointer ${
                        avatar === url ? 'border-white scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className={`flex items-center justify-end gap-2 pt-2 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <button
                  type="button"
                  onClick={() => setIsEditingNew(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    isDark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Pilih persona untuk sesi chat:
                </p>
                <button
                  onClick={startCreate}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 text-zinc-800 hover:bg-zinc-100'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>

              <div className="space-y-2">
                {personas.map((persona) => {
                  const isSelected = (selectedPersonaId || personas[0]?.id) === persona.id;

                  return (
                    <div
                      key={persona.id}
                      onClick={() => setSelectedPersonaId(persona.id)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                        isSelected
                          ? isDark
                            ? 'border-zinc-700 bg-zinc-900'
                            : 'border-zinc-400 bg-zinc-50'
                          : isDark
                            ? 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700'
                            : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <img
                        src={persona.avatar}
                        alt={persona.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold truncate">{persona.name}</h4>
                          {isSelected && (
                            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-500">
                              <UserCheck className="w-3 h-3" />
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] mt-0.5 line-clamp-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {persona.bio}
                        </p>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => startEdit(persona)}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                          title="Edit Persona"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {personas.length > 1 && (
                          <button
                            onClick={() => handleDelete(persona.id)}
                            className="p-1 rounded hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 cursor-pointer"
                            title="Hapus Persona"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

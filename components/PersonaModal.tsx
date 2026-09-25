'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { UserPersona } from '@/types';
import { X, UserCheck, Plus, Trash2, Edit3, Save, Sparkles, User } from 'lucide-react';

const PRESET_USER_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
];

export function PersonaModal() {
  const { isPersonaModalOpen, setIsPersonaModalOpen, selectedPersonaId, setSelectedPersonaId } = useAppStore();
  const personas = useLiveQuery(() => db.personas.toArray(), []) || [];

  const [isEditingNew, setIsEditingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] glass-panel rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-white/10">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Kelola Persona Pemain (User Persona)</h2>
              <p className="text-xs text-zinc-400">Identitas dan latar belakangmu yang dikenali oleh AI saat roleplay</p>
            </div>
          </div>
          <button
            onClick={() => setIsPersonaModalOpen(false)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isEditingNew ? (
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white">
                {editingId ? 'Edit Profil Persona' : 'Buat Persona Pemain Baru'}
              </h3>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Nama Kamu / Karakter Pemain</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Raven, Alex, Arthur Pendragon"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Deskripsi / Bio Persona</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Seorang petualang yang bersenjatakan pedang sihir, berkepribadian tenang dan bertekad kuat..."
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm resize-none"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  AI akan membaca bio ini agar memanggilmu dengan tepat dan menyesuaikan responnya.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">URL Avatar</label>
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={avatar || PRESET_USER_AVATARS[0]}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-cyan-500/40 shrink-0"
                  />
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-4 py-2 rounded-xl glass-input text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {PRESET_USER_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(url)}
                      className={`w-8 h-8 rounded-full overflow-hidden border cursor-pointer ${
                        avatar === url ? 'ring-2 ring-cyan-400 border-transparent scale-105' : 'border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsEditingNew(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Persona</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400">Pilih persona yang ingin kamu gunakan saat roleplay:</p>
                <button
                  onClick={startCreate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Persona</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {personas.map((persona) => {
                  const isSelected = (selectedPersonaId || personas[0]?.id) === persona.id;

                  return (
                    <div
                      key={persona.id}
                      onClick={() => setSelectedPersonaId(persona.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 shadow-md shadow-cyan-500/10'
                          : 'bg-zinc-900/60 border-white/5 text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      <img
                        src={persona.avatar}
                        alt={persona.name}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">{persona.name}</h4>
                          {isSelected && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold border border-cyan-500/30">
                              <UserCheck className="w-3 h-3" />
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{persona.bio}</p>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => startEdit(persona)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                          title="Edit Persona"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {personas.length > 1 && (
                          <button
                            onClick={() => handleDelete(persona.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            title="Hapus Persona"
                          >
                            <Trash2 className="w-4 h-4" />
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

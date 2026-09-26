'use client';

import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import { UserPersona } from '@/types';
import {
  Plus,
  UserCheck,
  Edit3,
  Trash2,
  Save,
  X,
  Upload,
  Camera,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { processImageFile } from '@/lib/utils';

const PRESET_USER_AVATARS = [
  '/avatars/sensei.png',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80',
];

export default function PersonasStudioPage() {
  const { selectedPersonaId, setSelectedPersonaId, theme } = useAppStore();
  const personas = useLiveQuery(() => db.personas.toArray(), []) || [];

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [avatarMode, setAvatarMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';

  const handleFileUpload = async (file?: File) => {
    if (!file) return;
    try {
      setIsUploading(true);
      const dataUrl = await processImageFile(file, 256, 0.85);
      setAvatar(dataUrl);
      setAvatarMode('upload');
    } catch (err: any) {
      alert(err?.message || 'Gagal memproses file gambar persona.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const startCreate = () => {
    setName('');
    setAvatar(PRESET_USER_AVATARS[0]);
    setBio('');
    setEditingId(null);
    setAvatarMode('upload');
    setIsEditing(true);
  };

  const startEdit = (persona: UserPersona) => {
    setName(persona.name);
    setAvatar(persona.avatar);
    setBio(persona.bio);
    setEditingId(persona.id);
    setAvatarMode('upload');
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
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Studio Header Banner */}
      <div className={`rounded-2xl p-6 border transition-colors ${
        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Persona Pemain
            </h1>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Atur identitas, nama, dan deskripsi kepribadianmu yang akan dibaca oleh karakter AI saat roleplay.
            </p>
          </div>

          <button
            onClick={startCreate}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-colors cursor-pointer self-start md:self-auto ${
              isDark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Persona</span>
          </button>
        </div>
      </div>

      {/* Persona Creator / Editor Form Card */}
      {isEditing && (
        <div className={`rounded-2xl p-6 border space-y-5 transition-colors ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-md'
        }`}>
          <div className={`flex items-center justify-between pb-3 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
            <h3 className="text-sm font-semibold">
              {editingId ? 'Edit Profil Persona' : 'Buat Persona Baru'}
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Avatar Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold">Foto Profil Persona</label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setAvatarMode('upload')}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      avatarMode === 'upload'
                        ? isDark ? 'bg-zinc-800 text-zinc-100 font-medium' : 'bg-zinc-200 text-zinc-900 font-medium'
                        : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarMode('url')}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      avatarMode === 'url'
                        ? isDark ? 'bg-zinc-800 text-zinc-100 font-medium' : 'bg-zinc-200 text-zinc-900 font-medium'
                        : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarMode('presets')}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      avatarMode === 'presets'
                        ? isDark ? 'bg-zinc-800 text-zinc-100 font-medium' : 'bg-zinc-200 text-zinc-900 font-medium'
                        : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    Preset
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                  e.target.value = '';
                }}
                className="hidden"
              />

              <div className={`flex flex-col items-center gap-3 p-4 rounded-xl border ${
                isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                {/* Avatar Preview Box */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative group w-20 h-20 rounded-full overflow-hidden border-2 transition-all cursor-pointer shrink-0 flex items-center justify-center ${
                    isDragOver
                      ? 'border-blue-500 scale-105 shadow-lg'
                      : isDark
                      ? 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                      : 'border-zinc-300 bg-zinc-200 hover:border-zinc-400'
                  }`}
                  title="Klik atau Drag & Drop gambar untuk upload"
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                  ) : (
                    <>
                      <img
                        src={avatar || PRESET_USER_AVATARS[0]}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-0.5">
                        <Camera className="w-4 h-4" />
                        <span className="text-[9px] font-medium">Ganti</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Sub Controls */}
                <div className="w-full space-y-2">
                  {avatarMode === 'upload' && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                          : 'bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-100'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Gambar</span>
                    </button>
                  )}

                  {avatarMode === 'url' && (
                    <input
                      type="text"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs border ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                      }`}
                    />
                  )}

                  {avatarMode === 'presets' && (
                    <div className="flex justify-center gap-1.5 flex-wrap">
                      {PRESET_USER_AVATARS.map((avUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(avUrl)}
                          className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                            avatar === avUrl
                              ? isDark ? 'border-white scale-110' : 'border-zinc-900 scale-110'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={avUrl} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Persona Details */}
            <div className="md:col-span-2 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">
                  Nama Persona <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Alex / Detektif Morgan"
                  className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm border ${
                    isDark ? 'bg-zinc-950/60 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">
                  Deskripsi / Bio Persona
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Deskripsikan latar belakang atau peranmu. AI akan menyesuaikan dialog berdasarkan info ini..."
                  className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm border resize-none ${
                    isDark ? 'bg-zinc-950/60 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    isDark ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
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
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isActive
                  ? isDark
                    ? 'border-zinc-700 bg-zinc-900'
                    : 'border-zinc-400 bg-white shadow-sm'
                  : isDark
                    ? 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700'
                    : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="relative shrink-0">
                  <img
                    src={persona.avatar}
                    alt={persona.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  {persona.isDefault && (
                    <span
                      title="Persona Default"
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-zinc-100 text-zinc-950 dark:bg-white dark:text-zinc-950 flex items-center justify-center text-[9px]"
                    >
                      <UserCheck className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">{persona.name}</h3>
                    {persona.isDefault && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded border ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                      }`}>
                        Default
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${
                    isDark ? 'text-zinc-400' : 'text-zinc-600'
                  }`}>
                    {persona.bio || 'Tidak ada deskripsi bio.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`flex items-center justify-between pt-3 mt-3 border-t ${
                isDark ? 'border-zinc-800/80' : 'border-zinc-100'
              }`}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedPersonaId(persona.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                      isActive
                        ? isDark ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold' : 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                        : isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200'
                    }`}
                  >
                    {isActive ? 'Aktif' : 'Pilih'}
                  </button>

                  {!persona.isDefault && (
                    <button
                      onClick={() => handleSetDefault(persona.id)}
                      className={`text-xs cursor-pointer hover:underline ${
                        isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800'
                      }`}
                    >
                      Set Default
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(persona)}
                    className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Edit Persona"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(persona.id)}
                    className="p-1 rounded-lg hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Hapus Persona"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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

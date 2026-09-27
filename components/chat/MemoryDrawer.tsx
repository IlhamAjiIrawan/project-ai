'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Character, SessionMemory, MemoryCategory, UserPersona } from '@/types';
import {
  X,
  Brain,
  Sparkles,
  Plus,
  Trash2,
  Check,
  Edit2,
  Save,
  ShieldAlert,
  Heart,
  Calendar,
  Lock,
  FileText,
  Loader2,
} from 'lucide-react';
import { extractMemoriesFromChat } from '@/lib/providers/engine';

interface MemoryDrawerProps {
  character: Character;
  persona?: UserPersona;
}

const CATEGORY_MAP: Record<
  MemoryCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  event: { label: 'Peristiwa', icon: Calendar, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  relation: { label: 'Hubungan', icon: Heart, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  promise: { label: 'Janji', icon: ShieldAlert, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  secret: { label: 'Rahasia', icon: Lock, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  fact: { label: 'Fakta', icon: FileText, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
};

export function MemoryDrawer({ character, persona }: MemoryDrawerProps) {
  const { isMemoryDrawerOpen, setIsMemoryDrawerOpen, selectedSessionId, settings, theme } = useAppStore();

  const memories = useLiveQuery(
    () => (selectedSessionId ? db.sessionMemories.where('sessionId').equals(selectedSessionId).reverse().sortBy('timestamp') : []),
    [selectedSessionId]
  ) || [];

  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('event');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<boolean>(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<MemoryCategory>('event');

  const isDark = theme === 'dark';

  if (!isMemoryDrawerOpen) return null;

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || !newContent.trim()) return;

    const newMem: SessionMemory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId: selectedSessionId,
      characterId: character.id,
      content: newContent.trim(),
      category: newCategory,
      source: 'manual',
      enabled: true,
      timestamp: Date.now(),
    };

    await db.sessionMemories.put(newMem);
    setNewContent('');
  };

  const handleToggleEnabled = async (id: string, current: boolean) => {
    await db.sessionMemories.update(id, { enabled: !current });
  };

  const handleDeleteMemory = async (id: string) => {
    await db.sessionMemories.delete(id);
  };

  const handleStartEdit = (mem: SessionMemory) => {
    setEditingId(mem.id);
    setEditContent(mem.content);
    setEditCategory(mem.category);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    await db.sessionMemories.update(id, {
      content: editContent.trim(),
      category: editCategory,
    });
    setEditingId(null);
  };

  const handleAutoExtract = async () => {
    if (!selectedSessionId || isExtracting) return;

    const chatHistory = await db.chatMessages.where('sessionId').equals(selectedSessionId).sortBy('timestamp');
    if (chatHistory.length < 2) {
      alert('Percakapan masih terlalu singkat untuk diekstraksi memori.');
      return;
    }

    setIsExtracting(true);
    setExtractError(false);
    setExtractStatus('Menganalisis & merekonsiliasi memori dengan alur percakapan...');

    try {
      const result = await extractMemoriesFromChat({
        character,
        userPersona: persona,
        chatHistory,
        existingMemories: memories,
        settings,
      });

      let addedCount = 0;
      let updatedCount = 0;
      let removedCount = 0;

      await db.transaction('rw', db.sessionMemories, async () => {
        // 1. Process Removals (Strictly protect manual memories)
        if (result.remove && result.remove.length > 0) {
          for (const item of result.remove) {
            const existing = memories.find((m) => m.id === item.id);
            if (existing && existing.source !== 'manual') {
              await db.sessionMemories.delete(item.id);
              removedCount++;
            }
          }
        }

        // 2. Process Updates
        if (result.update && result.update.length > 0) {
          for (const item of result.update) {
            const existing = memories.find((m) => m.id === item.id);
            if (existing) {
              const updates: Partial<SessionMemory> = {
                content: item.content,
                timestamp: Date.now(),
              };
              if (item.category) updates.category = item.category;
              if (item.importance) updates.importance = item.importance;
              await db.sessionMemories.update(item.id, updates);
              updatedCount++;
            }
          }
        }

        // 3. Process Additions (avoid duplicate content against current active)
        if (result.add && result.add.length > 0) {
          const currentList = await db.sessionMemories.where('sessionId').equals(selectedSessionId).toArray();
          const currentContents = new Set(currentList.map((m) => m.content.toLowerCase().trim()));

          for (const item of result.add) {
            if (!currentContents.has(item.content.toLowerCase().trim())) {
              const newMem: SessionMemory = {
                id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                sessionId: selectedSessionId,
                characterId: character.id,
                content: item.content,
                category: item.category,
                importance: item.importance || 'medium',
                source: 'auto',
                enabled: true,
                timestamp: Date.now(),
              };
              await db.sessionMemories.put(newMem);
              currentContents.add(item.content.toLowerCase().trim());
              addedCount++;
            }
          }
        }
      });

      setExtractError(false);
      if (addedCount === 0 && updatedCount === 0 && removedCount === 0) {
        setExtractStatus('Memori sudah optimal & mutakhir. Tidak ada perubahan yang diperlukan.');
      } else {
        const parts: string[] = [];
        if (addedCount > 0) parts.push(`+${addedCount} baru`);
        if (updatedCount > 0) parts.push(`~${updatedCount} diperbarui`);
        if (removedCount > 0) parts.push(`-${removedCount} selesai/dihapus`);
        setExtractStatus(`Sinkronisasi selesai: ${parts.join(', ')}`);
      }
      setTimeout(() => setExtractStatus(null), 5000);
    } catch (err: any) {
      const msg = err?.message || 'Gagal menghubungi AI untuk merekonsiliasi memori.';
      setExtractError(true);
      setExtractStatus(msg);
      alert(`Gagal mengekstrak memori:\n\n${msg}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const activeCount = memories.filter((m) => m.enabled).length;

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
            <div className={`p-2 rounded-xl ${isDark ? 'bg-zinc-900 text-zinc-200' : 'bg-zinc-100 text-zinc-800'}`}>
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Buku Memori Sesi</h3>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {activeCount} dari {memories.length} memori aktif diingat oleh {character.name}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMemoryDrawerOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Banner: Auto Extract & Reconcile */}
        <div className={`p-3 border-b space-y-2 shrink-0 ${
          isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-100'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleAutoExtract}
              disabled={isExtracting}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isExtracting
                  ? 'opacity-60 cursor-not-allowed bg-zinc-800 text-zinc-400'
                  : isDark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Merekonsiliasi & Memperbarui Memori...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sinkronisasi & Ekstrak Memori Otomatis</span>
                </>
              )}
            </button>
          </div>

          {extractStatus && (
            <div className={`p-2 rounded-lg text-[11px] font-medium leading-relaxed animate-in fade-in ${
              extractError
                ? isDark ? 'bg-rose-950/40 border border-rose-900/50 text-rose-300' : 'bg-rose-50 border border-rose-200 text-rose-700'
                : isDark ? 'bg-emerald-950/30 border border-emerald-900/40 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}>
              {extractStatus}
            </div>
          )}

          <p className={`text-[10px] leading-tight ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
            AI otomatis memperbarui fakta, mempertahankan peristiwa & janji aktif, dan menghapus peristiwa/janji yang sudah selesai untuk menghemat token.
          </p>
        </div>

        {/* Add Memory Form */}
        <form onSubmit={handleAddMemory} className={`p-3 border-b space-y-2 shrink-0 ${
          isDark ? 'border-zinc-800' : 'border-zinc-100'
        }`}>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {(Object.keys(CATEGORY_MAP) as MemoryCategory[]).map((cat) => {
              const meta = CATEGORY_MAP[cat];
              const Icon = meta.icon;
              const isSelected = newCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewCategory(cat)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? meta.color + ' font-semibold'
                      : isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={`Tulis fakta / peristiwa penting baru...`}
              className={`flex-1 px-3 py-1.5 rounded-xl text-xs border ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500' : 'bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400'
              }`}
            />
            <button
              type="submit"
              disabled={!newContent.trim()}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 shrink-0 cursor-pointer ${
                newContent.trim()
                  ? isDark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  : 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simpan</span>
            </button>
          </div>
        </form>

        {/* Memory List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
          {memories.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 space-y-2">
              <Brain className="w-8 h-8 text-zinc-600" />
              <p className="font-semibold text-xs text-zinc-400">Belum ada memori peristiwa yang dicatat.</p>
              <p className={`text-[11px] max-w-xs ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                Klik &quot;Sinkronisasi & Ekstrak Memori Otomatis&quot; di atas atau pin pesan penting di chat dengan ikon 📌.
              </p>
            </div>
          ) : (
            memories.map((mem) => {
              const meta = CATEGORY_MAP[mem.category] || CATEGORY_MAP.event;
              const Icon = meta.icon;
              const isEditing = editingId === mem.id;
              const isManual = mem.source === 'manual';

              return (
                <div
                  key={mem.id}
                  className={`p-3 rounded-xl border transition-all ${
                    !mem.enabled
                      ? 'opacity-40 border-dashed ' + (isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200')
                      : isDark ? 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-xs'
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 overflow-x-auto pb-1">
                        {(Object.keys(CATEGORY_MAP) as MemoryCategory[]).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setEditCategory(cat)}
                            className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
                              editCategory === cat
                                ? CATEGORY_MAP[cat].color
                                : isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-400'
                            }`}
                          >
                            {CATEGORY_MAP[cat].label}
                          </button>
                        ))}
                      </div>
                      <textarea
                        rows={2}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className={`w-full p-2 rounded-lg text-xs border resize-none ${
                          isDark ? 'bg-zinc-950 border-zinc-700 text-zinc-100' : 'bg-white border-zinc-300 text-zinc-900'
                        }`}
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 rounded text-[11px] text-zinc-400 hover:text-white"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(mem.id)}
                          className={`flex items-center gap-1 px-3 py-1 rounded text-[11px] font-medium ${
                            isDark ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-white'
                          }`}
                        >
                          <Save className="w-3 h-3" />
                          Simpan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border ${meta.color}`}>
                            <Icon className="w-2.5 h-2.5" />
                            <span>{meta.label}</span>
                          </span>

                          {isManual ? (
                            <span
                              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium border ${
                                isDark
                                  ? 'bg-zinc-800/80 text-zinc-300 border-zinc-700'
                                  : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                              }`}
                              title="Memori manual (Dilindungi dari penghapusan otomatis AI)"
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>Manual</span>
                            </span>
                          ) : (
                            <span
                              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium border ${
                                isDark
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                              title="Diekstrak & disinkronkan otomatis oleh AI"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Auto</span>
                            </span>
                          )}

                          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                            {new Date(mem.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleEnabled(mem.id, mem.enabled)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border cursor-pointer ${
                              mem.enabled
                                ? isDark ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-emerald-200 text-emerald-700 bg-emerald-50'
                                : isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-400'
                            }`}
                            title={mem.enabled ? 'Nonaktifkan memori ini' : 'Aktifkan memori ini'}
                          >
                            {mem.enabled ? 'Diingat' : 'Diabaikan'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartEdit(mem)}
                            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMemory(mem.id)}
                            className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className={`text-xs leading-relaxed ${mem.enabled ? (isDark ? 'text-zinc-200' : 'text-zinc-800') : 'line-through text-zinc-500'}`}>
                        {mem.content}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

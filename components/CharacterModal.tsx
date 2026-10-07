'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/db';
import { Character, LoreEntry, ProviderType, ResponseLengthType } from '@/types';
import {
  X,
  Bot,
  User,
  Sliders,
  BookOpen,
  Plus,
  Trash2,
  Save,
  MessageSquare,
  Upload,
  Camera,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { POPULAR_MODELS } from '@/lib/providers/types';
import { processImageFile } from '@/lib/utils';

const PRESET_AVATARS = [
  '/avatars/hutao.png',
  '/avatars/furina.png',
  '/avatars/Noa.png',
  '/avatars/Hanako.png',
  '/avatars/Ako.png',
  '/avatars/professor_niyaniya.png',
  '/avatars/sparkle.png',
  '/avatars/Aiko.png',
];

export function CharacterModal() {
  const { isCharacterModalOpen, setIsCharacterModalOpen, editingCharacter, setEditingCharacter, theme } = useAppStore();

  const [activeTab, setActiveTab] = useState<'basic' | 'personality' | 'scenario' | 'lore' | 'model'>('basic');

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [avatar, setAvatar] = useState('');
  const [category, setCategory] = useState<Character['category']>('scifi');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDragOverAvatar, setIsDragOverAvatar] = useState(false);
  const [avatarInputMode, setAvatarInputMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);


  const [systemPrompt, setSystemPrompt] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [scenario, setScenario] = useState('');
  const [exampleDialogue, setExampleDialogue] = useState('');

  const [lorebook, setLorebook] = useState<LoreEntry[]>([]);
  const [customProvider, setCustomProvider] = useState<ProviderType | ''>('');
  const [customModel, setCustomModel] = useState('');
  const [temperature, setTemperature] = useState(0.8);
  const [responseLength, setResponseLength] = useState<ResponseLengthType | ''>('');
  const [maxTokens, setMaxTokens] = useState(1000);
  const [topP, setTopP] = useState(0.95);
  const [topA, setTopA] = useState(0.0);
  const [topK, setTopK] = useState(40);
  const [repetitionPenalty, setRepetitionPenalty] = useState(1.1);

  // 4 Memory Parameters
  const [contextLimit, setContextLimit] = useState<number | undefined>(undefined);
  const [ltmContextBudget, setLtmContextBudget] = useState<number | undefined>(undefined);
  const [embeddingContextBudget, setEmbeddingContextBudget] = useState<number | undefined>(undefined);
  const [chatHistoryDepth, setChatHistoryDepth] = useState<number | undefined>(undefined);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (editingCharacter) {
      setName(editingCharacter.name);
      setTagline(editingCharacter.tagline || '');
      setAvatar(editingCharacter.avatar);
      setCategory(editingCharacter.category || 'scifi');
      setDescription(editingCharacter.description || '');
      setTagsInput(editingCharacter.tags ? editingCharacter.tags.join(', ') : '');
      setSystemPrompt(editingCharacter.systemPrompt || '');
      setGreetingMessage(editingCharacter.greetingMessage || '');
      setScenario(editingCharacter.scenario || '');
      setExampleDialogue(editingCharacter.exampleDialogue || '');
      setLorebook(editingCharacter.lorebook || []);
      setCustomProvider(editingCharacter.customProvider || '');
      setCustomModel(editingCharacter.customModel || '');
      setTemperature(editingCharacter.temperature ?? 0.8);
      setResponseLength(editingCharacter.responseLength || '');
      setMaxTokens(editingCharacter.maxTokens ?? 1000);
      setTopP(editingCharacter.topP ?? 0.95);
      setTopA(editingCharacter.topA ?? 0.0);
      setTopK(editingCharacter.topK ?? 40);
      setRepetitionPenalty(editingCharacter.repetitionPenalty ?? 1.1);
      setContextLimit(editingCharacter.contextLimit);
      setLtmContextBudget(editingCharacter.ltmContextBudget);
      setEmbeddingContextBudget(editingCharacter.embeddingContextBudget);
      setChatHistoryDepth(editingCharacter.chatHistoryDepth);
    } else {
      setName('');
      setTagline('');
      setAvatar(PRESET_AVATARS[0]);
      setCategory('scifi');
      setDescription('');
      setTagsInput('Roleplay, Adventure');
      setSystemPrompt('Kamu adalah karakter roleplay...');
      setGreetingMessage('*Tersenyum menyapamu.* "Halo, ada yang bisa kubantu?"');
      setScenario('Di sebuah kafe yang tenang.');
      setExampleDialogue('<START>\n{{user}}: "Halo!"\n{{char}}: "Halo juga!"');
      setLorebook([]);
      setCustomProvider('');
      setCustomModel('');
      setTemperature(0.8);
      setResponseLength('');
      setMaxTokens(1000);
      setTopP(0.95);
      setTopA(0.0);
      setTopK(40);
      setRepetitionPenalty(1.1);
      setContextLimit(undefined);
      setLtmContextBudget(undefined);
      setEmbeddingContextBudget(undefined);
      setChatHistoryDepth(undefined);
    }
  }, [editingCharacter, isCharacterModalOpen]);

  if (!isCharacterModalOpen) return null;

  const applyParameterPreset = (type: 'novelist' | 'creative' | 'rpg' | 'precise') => {
    switch (type) {
      case 'novelist':
        setTemperature(0.85);
        setResponseLength('long');
        setMaxTokens(1500);
        setTopP(0.90);
        setTopA(0.20);
        setTopK(40);
        setRepetitionPenalty(1.10);
        setContextLimit(8192);
        setLtmContextBudget(1200);
        setEmbeddingContextBudget(800);
        setChatHistoryDepth(30);
        break;
      case 'creative':
        setTemperature(1.05);
        setResponseLength('medium');
        setMaxTokens(1200);
        setTopP(0.95);
        setTopA(0.00);
        setTopK(60);
        setRepetitionPenalty(1.05);
        setContextLimit(4096);
        setLtmContextBudget(800);
        setEmbeddingContextBudget(500);
        setChatHistoryDepth(20);
        break;
      case 'rpg':
        setTemperature(0.70);
        setResponseLength('medium');
        setMaxTokens(1000);
        setTopP(0.85);
        setTopA(0.15);
        setTopK(40);
        setRepetitionPenalty(1.12);
        setContextLimit(6144);
        setLtmContextBudget(1000);
        setEmbeddingContextBudget(1000);
        setChatHistoryDepth(24);
        break;
      case 'precise':
        setTemperature(0.40);
        setResponseLength('short');
        setMaxTokens(800);
        setTopP(0.80);
        setTopA(0.30);
        setTopK(30);
        setRepetitionPenalty(1.00);
        setContextLimit(3072);
        setLtmContextBudget(400);
        setEmbeddingContextBudget(300);
        setChatHistoryDepth(14);
        break;
    }
  };

  const handleAddLoreEntry = () => {
    setLorebook([
      ...lorebook,
      {
        id: `lore_${Date.now()}`,
        keys: ['kata_kunci'],
        content: 'Informasi latar belakang yang diinjeksikan...',
        enabled: true,
      },
    ]);
  };

  const handleRemoveLoreEntry = (id: string) => {
    setLorebook(lorebook.filter((e) => e.id !== id));
  };

  const handleUpdateLoreKeys = (id: string, keysString: string) => {
    const keys = keysString.split(',').map((k) => k.trim()).filter(Boolean);
    setLorebook(lorebook.map((e) => (e.id === id ? { ...e, keys } : e)));
  };

  const handleUpdateLoreContent = (id: string, content: string) => {
    setLorebook(lorebook.map((e) => (e.id === id ? { ...e, content } : e)));
  };

  const handleAvatarFileSelected = async (file?: File) => {
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      const dataUrl = await processImageFile(file, 512, 0.88);
      setAvatar(dataUrl);
      setAvatarInputMode('upload');
    } catch (err: any) {
      alert(err?.message || 'Gagal memproses file gambar avatar.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverAvatar(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleAvatarFileSelected(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Nama karakter tidak boleh kosong.');
      return;
    }
    if (!greetingMessage.trim()) {
      alert('Pesan pembuka (Greeting Message) tidak boleh kosong.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const charData: Character = {
      id: editingCharacter ? editingCharacter.id : `char_${Date.now()}_custom`,
      name: name.trim(),
      avatar: avatar.trim() || PRESET_AVATARS[0],
      tagline: tagline.trim(),
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
      greetingMessage: greetingMessage.trim(),
      scenario: scenario.trim(),
      exampleDialogue: exampleDialogue.trim(),
      tags: tags.length > 0 ? tags : ['Custom'],
      category,
      lorebook,
      customProvider: customProvider ? (customProvider as ProviderType) : undefined,
      customModel: customModel.trim() || undefined,
      temperature,
      responseLength: responseLength ? (responseLength as ResponseLengthType) : undefined,
      maxTokens,
      topP,
      topA,
      topK,
      repetitionPenalty,
      contextLimit,
      ltmContextBudget,
      embeddingContextBudget,
      chatHistoryDepth,
      isCustom: true,
      createdAt: editingCharacter ? editingCharacter.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    await db.characters.put(charData);
    setIsCharacterModalOpen(false);
    setEditingCharacter(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`relative w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[90vh] rounded-none sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl border-0 sm:border transition-colors ${isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              {editingCharacter ? `Edit Karakter: ${editingCharacter.name}` : 'Buat Karakter Baru'}
            </h2>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Rancang profil, kepribadian, skenario, dan lorebook karakter
            </p>
          </div>
          <button
            onClick={() => setIsCharacterModalOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex items-center gap-1 px-4 sm:px-5 pt-2.5 border-b overflow-x-auto scrollbar-none ${isDark ? 'border-zinc-800' : 'border-zinc-100'
          }`}>
          {[
            { id: 'basic', label: '1. Profil Dasar', icon: User },
            { id: 'personality', label: '2. Kepribadian', icon: Bot },
            { id: 'scenario', label: '3. Skenario', icon: MessageSquare },
            { id: 'lore', label: '4. Lorebook', icon: BookOpen },
            { id: 'model', label: '5. Model AI', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${isActive
                  ? isDark ? 'border-zinc-100 text-zinc-100 font-semibold' : 'border-zinc-900 text-zinc-900 font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          {activeTab === 'basic' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Nama Karakter <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Kaelen sang Pemburu"
                    className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                      }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border cursor-pointer ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                      }`}
                  >
                    <option value="scifi">Sci-Fi / Cyberpunk</option>
                    <option value="fantasy">High Fantasy</option>
                    <option value="anime">Anime & Companion</option>
                    <option value="mystery">Misteri & Detektif</option>
                    <option value="rpg">RPG Game Master</option>
                    <option value="romance">Romance</option>
                    <option value="assistant">Asisten Khusus</option>
                    <option value="custom">Kustom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Tagline Singkat</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Contoh: Penyihir es dari kerajaan utara"
                  className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Deskripsi / Latar Belakang</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Latar belakang, motif, dan detail penampilan..."
                  className={`w-full px-3 py-2 rounded-xl border resize-none ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                />
              </div>

              {/* Avatar Upload & Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold">
                    Foto Profil / Avatar Karakter
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAvatarInputMode('upload')}
                      className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${avatarInputMode === 'upload'
                        ? isDark ? 'bg-zinc-800 text-zinc-100 font-medium' : 'bg-zinc-200 text-zinc-900 font-medium'
                        : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarInputMode('url')}
                      className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${avatarInputMode === 'url'
                        ? isDark ? 'bg-zinc-800 text-zinc-100 font-medium' : 'bg-zinc-200 text-zinc-900 font-medium'
                        : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-700'
                        }`}
                    >
                      URL Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarInputMode('presets')}
                      className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${avatarInputMode === 'presets'
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
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarFileSelected(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                  {/* Avatar Preview Box with Upload Trigger */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOverAvatar(true);
                    }}
                    onDragLeave={() => setIsDragOverAvatar(false)}
                    onDrop={handleAvatarDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative group w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 flex items-center justify-center ${isDragOverAvatar
                      ? 'border-blue-500 bg-blue-500/10 scale-105 shadow-lg'
                      : isDark
                        ? 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                        : 'border-zinc-300 bg-zinc-100 hover:border-zinc-400'
                      }`}
                    title="Klik atau Drag & Drop gambar untuk upload foto profil"
                  >
                    {isUploadingAvatar ? (
                      <div className="flex flex-col items-center gap-1 text-center p-1">
                        <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                        <span className="text-[10px] text-zinc-400">Memproses...</span>
                      </div>
                    ) : avatar ? (
                      <>
                        <img
                          src={avatar}
                          alt="Avatar preview"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 p-1 text-center">
                          <Camera className="w-4 h-4" />
                          <span className="text-[9px] font-medium leading-tight">Ganti Foto</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-zinc-400 p-2 text-center">
                        <Upload className="w-5 h-5" />
                        <span className="text-[10px]">Upload</span>
                      </div>
                    )}
                  </div>

                  {/* Right controls based on mode */}
                  <div className="flex-1 w-full space-y-2">
                    {avatarInputMode === 'upload' && (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragOverAvatar(true);
                        }}
                        onDragLeave={() => setIsDragOverAvatar(false)}
                        onDrop={handleAvatarDrop}
                        className={`p-3 rounded-xl border border-dashed flex flex-col sm:flex-row items-center justify-between gap-2.5 transition-colors ${isDragOverAvatar
                          ? 'border-blue-500 bg-blue-500/10'
                          : isDark
                            ? 'border-zinc-800 bg-zinc-900/50'
                            : 'border-zinc-200 bg-zinc-50'
                          }`}
                      >
                        <div className="text-center sm:text-left">
                          <p className="text-xs font-medium">Upload File dari Komputer</p>
                          <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                            PNG, JPG, WEBP, GIF (Otomatis dioptimalkan)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer shrink-0 ${isDark
                            ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
                            : 'bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-100'
                            }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pilih File Gambar</span>
                        </button>
                      </div>
                    )}

                    {avatarInputMode === 'url' && (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={avatar}
                          onChange={(e) => setAvatar(e.target.value)}
                          placeholder="https://example.com/avatar.jpg"
                          className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                            }`}
                        />
                        <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          Masukkan tautan langsung gambar (Direct Image URL).
                        </p>
                      </div>
                    )}

                    {avatarInputMode === 'presets' && (
                      <div>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          {PRESET_AVATARS.map((presetUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setAvatar(presetUrl)}
                              className={`w-8 h-8 rounded-lg overflow-hidden border transition-all shrink-0 cursor-pointer ${avatar === presetUrl
                                ? isDark ? 'border-white scale-110 shadow' : 'border-zinc-900 scale-110 shadow'
                                : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                            >
                              <img src={presetUrl} alt="preset" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          Klik salah satu avatar preset di atas untuk memilih.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Tags (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Cyberpunk, Netrunner, Hacker"
                  className={`w-full px-3 py-2 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                />
              </div>
            </div>
          )}

          {activeTab === 'personality' && (
            <div className="space-y-3.5">
              <div className={`p-2.5 rounded-xl border text-xs ${isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
                }`}>
                Tips: Gunakan <code>{'{{char}}'}</code> untuk nama karakter dan <code>{'{{user}}'}</code> untuk nama pemain.
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  System Prompt (Instruksi Kepribadian)
                </label>
                <textarea
                  rows={5}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Kamu adalah {{char}}. Kepribadianmu: tenang, logis, tidak suka basa-basi..."
                  className={`w-full px-3 py-2 rounded-xl border font-mono text-xs ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Pesan Pembuka (Greeting Message) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  placeholder="*Melihatmu melangkah masuk.* 'Selamat datang, {{user}}.'"
                  className={`w-full px-3 py-2 rounded-xl border font-mono text-xs ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                />
              </div>
            </div>
          )}

          {activeTab === 'scenario' && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">Skenario & Latar Tempat</label>
                <textarea
                  rows={3}
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="Di sebuah kafe di sudut kota saat hujan..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Contoh Dialog (Few-shot)
                </label>
                <textarea
                  rows={5}
                  value={exampleDialogue}
                  onChange={(e) => setExampleDialogue(e.target.value)}
                  placeholder="<START>&#10;{{user}}: 'Bisa bantu aku?'&#10;{{char}}: *Tersenyum.* 'Tentu, apa yang bisa kubantu?'"
                  className={`w-full px-3 py-2 rounded-xl border font-mono text-xs ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                />
              </div>
            </div>
          )}

          {activeTab === 'lore' && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold">Lorebook / Memori Kontekstual</h3>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Diinjeksikan saat kata kunci disebut di percakapan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddLoreEntry}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer ${isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200'
                    }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah
                </button>
              </div>

              {lorebook.length === 0 ? (
                <div className={`p-6 text-center border border-dashed rounded-xl ${isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-400'
                  }`}>
                  <p className="text-xs">Belum ada memori Lorebook.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {lorebook.map((entry, index) => (
                    <div key={entry.id} className={`p-3 rounded-xl border space-y-2 ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                      }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Entri #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLoreEntry(entry.id)}
                          className="p-1 rounded text-zinc-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={entry.keys.join(', ')}
                        onChange={(e) => handleUpdateLoreKeys(entry.id, e.target.value)}
                        placeholder="Kata kunci trigger (pisahkan koma)..."
                        className={`w-full px-2.5 py-1 rounded-lg text-xs border ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                          }`}
                      />

                      <textarea
                        rows={2}
                        value={entry.content}
                        onChange={(e) => handleUpdateLoreContent(entry.id, e.target.value)}
                        placeholder="Pengetahuan/fakta yang diinjeksikan..."
                        className={`w-full px-2.5 py-1 rounded-lg text-xs border resize-none ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                          }`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'model' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Provider Override</label>
                  <select
                    value={customProvider}
                    onChange={(e) => {
                      const newProvider = e.target.value as ProviderType | '';
                      setCustomProvider(newProvider);
                      if (newProvider && newProvider !== 'custom') {
                        const defaultForProvider = POPULAR_MODELS.find((m) => m.provider === newProvider);
                        if (defaultForProvider) setCustomModel(defaultForProvider.id);
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer border ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                      }`}
                  >
                    <option value="">Gunakan Default Pengaturan</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="groq">Groq</option>
                    <option value="openai">OpenAI</option>
                    <option value="custom">Custom / Ollama Local</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Model Name Override</label>
                  {customProvider && customProvider !== 'custom' ? (
                    <select
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer border ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                        }`}
                    >
                      {POPULAR_MODELS.filter((m) => m.provider === customProvider).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      placeholder={customProvider === 'custom' ? 'gemma2:27b' : 'Default dari pengaturan'}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-mono border ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                        }`}
                    />
                  )}
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold">Preset Parameter Cepat</label>
                  <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Klik untuk atur ke-7 parameter</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyParameterPreset('novelist')}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${isDark ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                      }`}
                  >
                    <p className="font-semibold text-xs">Novelist</p>
                    <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Deskriptif & kaya narasi</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyParameterPreset('creative')}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${isDark ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                      }`}
                  >
                    <p className="font-semibold text-xs">Kreatif & Bebas</p>
                    <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Variatif & tak terduga</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyParameterPreset('rpg')}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${isDark ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                      }`}
                  >
                    <p className="font-semibold text-xs">RPG Master</p>
                    <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Logis & seimbang</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyParameterPreset('precise')}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${isDark ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                      }`}
                  >
                    <p className="font-semibold text-xs">Presisi</p>
                    <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Ketat pada prompt</p>
                  </button>
                </div>
              </div>

              {/* 7 AI Parameters Section */}
              <div className={`p-4 rounded-xl border space-y-4 ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Konfigurasi Detail 7 Parameter AI (Override Karakter)
                </h3>

                {/* 1. Temperature */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1">
                      1. Temperature (Kreativitas):
                      <span className="font-mono text-zinc-400 font-normal">{temperature}</span>
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {temperature > 1.0 ? 'Sangat Bebas' : temperature >= 0.7 ? 'Seimbang (Cerita)' : 'Terfokus/Logis'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.5"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full cursor-pointer accent-zinc-500"
                  />
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Mengatur keacakan pemilihan kata khusus karakter ini.
                  </p>
                </div>

                {/* 2. Panjang Respon */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold">2. Target Panjang Respon:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: '', label: 'Default', desc: 'Ikuti Pengaturan' },
                      { id: 'short', label: 'Singkat', desc: '1-2 paragraf' },
                      { id: 'medium', label: 'Sedang', desc: '2-3 paragraf' },
                      { id: 'long', label: 'Panjang', desc: '4+ paragraf' },
                      { id: 'unlimited', label: 'Bebas', desc: 'Fleksibel' },
                    ].map((len) => (
                      <button
                        key={len.id}
                        type="button"
                        onClick={() => setResponseLength(len.id as ResponseLengthType | '')}
                        className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${responseLength === len.id
                          ? isDark ? 'bg-zinc-800 text-zinc-100 border-zinc-600 font-semibold' : 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                          : isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                          }`}
                      >
                        <p className="text-xs font-semibold">{len.label}</p>
                        <p className={`text-[9px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{len.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Max Tokens */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1">
                      3. Max Tokens (Batas Kuota Output):
                      <span className="font-mono text-zinc-400 font-normal">{maxTokens}</span>
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      ~{Math.round(maxTokens * 0.75)} kata
                    </span>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="4000"
                    step="100"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full cursor-pointer accent-zinc-500"
                  />
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Batas keras jumlah token balasan untuk karakter ini.
                  </p>
                </div>

                {/* 4. Top-P */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1">
                      4. Top-P / Nucleus Sampling:
                      <span className="font-mono text-zinc-400 font-normal">{topP}</span>
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {Math.round(topP * 100)}% kandidat teratas
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                    className="w-full cursor-pointer accent-zinc-500"
                  />
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Memilih kata dari kelompok probabilitas teratas.
                  </p>
                </div>

                {/* 5. Top-A */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1">
                      5. Top-A (Dynamic Cutoff):
                      <span className="font-mono text-zinc-400 font-normal">{topA}</span>
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {topA === 0 ? 'Nonaktif' : 'Aktif'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={topA}
                    onChange={(e) => setTopA(parseFloat(e.target.value))}
                    className="w-full cursor-pointer accent-zinc-500"
                  />
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Memangkas kata jika kata teratas dominan, mencegah balasan keluar dari persona.
                  </p>
                </div>

                {/* 6. Top-K */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1">
                      6. Top-K (Batas Jumlah Kandidat):
                      <span className="font-mono text-zinc-400 font-normal">{topK}</span>
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {topK === 0 ? 'Semua kata' : `${topK} kata teratas`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value))}
                    className="w-full cursor-pointer accent-zinc-500"
                  />
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Membatasi pilihan kata ke sejumlah K kandidat teratas.
                  </p>
                </div>

                {/* 7. Repetition Penalty */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1">
                      7. Repetition Penalty (Penalti Pengulangan):
                      <span className="font-mono text-zinc-400 font-normal">{repetitionPenalty}</span>
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {repetitionPenalty > 1.0 ? 'Mencegah Looping' : 'Normal'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.0"
                    step="0.05"
                    value={repetitionPenalty}
                    onChange={(e) => setRepetitionPenalty(parseFloat(e.target.value))}
                    className="w-full cursor-pointer accent-zinc-500"
                  />
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Mencegah karakter mengulang kalimat atau frasa secara monoton.
                  </p>
                </div>
              </div>

              {/* 4 Memory & Context Window Parameters Section */}
              <div className={`p-4 rounded-xl border space-y-4 ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Manajemen Memori & Jendela Konteks (Override Karakter)
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-600'
                    }`}>
                    Token Budgeting
                  </span>
                </div>

                {/* 1. Context Limit */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1">
                      1. Context Limit (Batas Total Konteks):
                      <span className="font-mono text-zinc-400 font-normal">
                        {contextLimit !== undefined ? `${contextLimit} Token` : 'Default Pengaturan (4096)'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setContextLimit(contextLimit === undefined ? 4096 : undefined)}
                      className={`text-[10px] cursor-pointer hover:underline ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
                    >
                      {contextLimit === undefined ? 'Set Khusus' : 'Reset ke Default'}
                    </button>
                  </div>
                  {contextLimit !== undefined && (
                    <input
                      type="range"
                      min="2048"
                      max="32768"
                      step="512"
                      value={contextLimit}
                      onChange={(e) => setContextLimit(parseInt(e.target.value))}
                      className="w-full cursor-pointer accent-zinc-500"
                    />
                  )}
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Batas total token gabungan (System Prompt + Memori + Riwayat Chat + Jawaban AI).
                  </p>
                </div>

                {/* 2. LTM Context Budget */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1">
                      2. LTM Context Budget (Kuota Memori Peristiwa):
                      <span className="font-mono text-zinc-400 font-normal">
                        {ltmContextBudget !== undefined ? `${ltmContextBudget} Token` : 'Default Pengaturan (500)'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setLtmContextBudget(ltmContextBudget === undefined ? 500 : undefined)}
                      className={`text-[10px] cursor-pointer hover:underline ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
                    >
                      {ltmContextBudget === undefined ? 'Set Khusus' : 'Reset ke Default'}
                    </button>
                  </div>
                  {ltmContextBudget !== undefined && (
                    <input
                      type="range"
                      min="200"
                      max="3000"
                      step="50"
                      value={ltmContextBudget}
                      onChange={(e) => setLtmContextBudget(parseInt(e.target.value))}
                      className="w-full cursor-pointer accent-zinc-500"
                    />
                  )}
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Alokasi token khusus untuk memori peristiwa penting, janji, rahasia, dan relasi.
                  </p>
                </div>

                {/* 3. Embedding Context Budget */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1">
                      3. Embedding Context Budget (Kuota World Lore / RAG):
                      <span className="font-mono text-zinc-400 font-normal">
                        {embeddingContextBudget !== undefined ? `${embeddingContextBudget} Token` : 'Default Pengaturan (250)'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEmbeddingContextBudget(embeddingContextBudget === undefined ? 250 : undefined)}
                      className={`text-[10px] cursor-pointer hover:underline ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
                    >
                      {embeddingContextBudget === undefined ? 'Set Khusus' : 'Reset ke Default'}
                    </button>
                  </div>
                  {embeddingContextBudget !== undefined && (
                    <input
                      type="range"
                      min="100"
                      max="2000"
                      step="50"
                      value={embeddingContextBudget}
                      onChange={(e) => setEmbeddingContextBudget(parseInt(e.target.value))}
                      className="w-full cursor-pointer accent-zinc-500"
                    />
                  )}
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Alokasi token untuk entri lorebook / ensiklopedia dunia yang cocok dengan topik.
                  </p>
                </div>

                {/* 4. Chat History Depth */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1">
                      4. Chat History Depth (Kedalaman Riwayat Chat):
                      <span className="font-mono text-zinc-400 font-normal">
                        {chatHistoryDepth !== undefined ? `${chatHistoryDepth} Pesan` : 'Default Pengaturan (20)'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setChatHistoryDepth(chatHistoryDepth === undefined ? 20 : undefined)}
                      className={`text-[10px] cursor-pointer hover:underline ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}
                    >
                      {chatHistoryDepth === undefined ? 'Set Khusus' : 'Reset ke Default'}
                    </button>
                  </div>
                  {chatHistoryDepth !== undefined && (
                    <input
                      type="range"
                      min="4"
                      max="60"
                      step="2"
                      value={chatHistoryDepth}
                      onChange={(e) => setChatHistoryDepth(parseInt(e.target.value))}
                      className="w-full cursor-pointer accent-zinc-500"
                    />
                  )}
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Jumlah pesan terbaru yang langsung dikirimkan ke AI sebagai riwayat aktif.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-3.5 sm:p-5 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t flex items-center justify-end gap-2 shrink-0 ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-100 bg-white'
          }`}>
          <button
            type="button"
            onClick={() => setIsCharacterModalOpen(false)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${isDark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Karakter</span>
          </button>
        </div>
      </div>
    </div>
  );
}

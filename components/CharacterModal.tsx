'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/db';
import { Character, LoreEntry, ProviderType } from '@/types';
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
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
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

  const [systemPrompt, setSystemPrompt] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [scenario, setScenario] = useState('');
  const [exampleDialogue, setExampleDialogue] = useState('');

  const [lorebook, setLorebook] = useState<LoreEntry[]>([]);
  const [customProvider, setCustomProvider] = useState<ProviderType | ''>('');
  const [customModel, setCustomModel] = useState('');
  const [temperature, setTemperature] = useState(0.8);
  const [maxTokens, setMaxTokens] = useState(1000);

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
      setMaxTokens(editingCharacter.maxTokens ?? 1000);
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
      setMaxTokens(1000);
    }
  }, [editingCharacter, isCharacterModalOpen]);

  if (!isCharacterModalOpen) return null;

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
      maxTokens,
      isCustom: true,
      createdAt: editingCharacter ? editingCharacter.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    await db.characters.put(charData);
    setIsCharacterModalOpen(false);
    setEditingCharacter(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`relative w-full max-w-3xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border transition-colors ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
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
        <div className={`flex items-center gap-1 px-4 sm:px-5 pt-2.5 border-b overflow-x-auto scrollbar-none ${
          isDark ? 'border-zinc-800' : 'border-zinc-100'
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
                className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
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
                    className={`w-full px-3 py-2 rounded-xl border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border cursor-pointer ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
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
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
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
                  className={`w-full px-3 py-2 rounded-xl border resize-none ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-semibold mb-1">Avatar Karakter</label>
                <div className="flex items-center gap-3">
                  <img
                    src={avatar || PRESET_AVATARS[0]}
                    alt="Avatar preview"
                    className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0"
                  />
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="URL gambar avatar..."
                    className={`flex-1 px-3 py-2 rounded-xl border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(presetUrl)}
                      className={`w-7 h-7 rounded-lg overflow-hidden border transition-all shrink-0 cursor-pointer ${
                        avatar === presetUrl ? 'border-white scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={presetUrl} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Tags (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Cyberpunk, Netrunner, Hacker"
                  className={`w-full px-3 py-2 rounded-xl border ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                />
              </div>
            </div>
          )}

          {activeTab === 'personality' && (
            <div className="space-y-3.5">
              <div className={`p-2.5 rounded-xl border text-xs ${
                isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'
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
                  className={`w-full px-3 py-2 rounded-xl border font-mono text-xs ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
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
                  className={`w-full px-3 py-2 rounded-xl border font-mono text-xs ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
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
                  className={`w-full px-3 py-2 rounded-xl border text-xs ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
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
                  className={`w-full px-3 py-2 rounded-xl border font-mono text-xs ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
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
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah
                </button>
              </div>

              {lorebook.length === 0 ? (
                <div className={`p-6 text-center border border-dashed rounded-xl ${
                  isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-400'
                }`}>
                  <p className="text-xs">Belum ada memori Lorebook.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {lorebook.map((entry, index) => (
                    <div key={entry.id} className={`p-3 rounded-xl border space-y-2 ${
                      isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
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
                        className={`w-full px-2.5 py-1 rounded-lg text-xs border ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                        }`}
                      />

                      <textarea
                        rows={2}
                        value={entry.content}
                        onChange={(e) => handleUpdateLoreContent(entry.id, e.target.value)}
                        placeholder="Pengetahuan/fakta yang diinjeksikan..."
                        className={`w-full px-2.5 py-1 rounded-lg text-xs border resize-none ${
                          isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'model' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold mb-1">Provider Override</label>
                  <select
                    value={customProvider}
                    onChange={(e) => setCustomProvider(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border cursor-pointer ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
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

                <div>
                  <label className="block text-xs font-semibold mb-1">Model Name</label>
                  <input
                    type="text"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="deepseek/deepseek-r1, gemma2..."
                    className={`w-full px-3 py-2 rounded-xl border font-mono text-xs ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Temperature</span>
                    <span className="font-mono">{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={1.5}
                    step={0.05}
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full cursor-pointer accent-zinc-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Max Tokens</span>
                    <span className="font-mono">{maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={3000}
                    step={100}
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full cursor-pointer accent-zinc-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-end gap-2 ${
          isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-100 bg-white'
        }`}>
          <button
            type="button"
            onClick={() => setIsCharacterModalOpen(false)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
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
            <span>Simpan Karakter</span>
          </button>
        </div>
      </div>
    </div>
  );
}

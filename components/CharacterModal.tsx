'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/db';
import { Character, LoreEntry, ProviderType } from '@/types';
import {
  X,
  Sparkles,
  Bot,
  User,
  Sliders,
  BookOpen,
  Plus,
  Trash2,
  Image as ImageIcon,
  Save,
  MessageSquare,
} from 'lucide-react';
import { POPULAR_MODELS } from '@/lib/providers/types';

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
  const { isCharacterModalOpen, setIsCharacterModalOpen, editingCharacter, setEditingCharacter } = useAppStore();

  const [activeTab, setActiveTab] = useState<'basic' | 'personality' | 'scenario' | 'lore' | 'model'>('basic');

  // Form states
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
      // Reset form
      setName('');
      setTagline('');
      setAvatar(PRESET_AVATARS[0]);
      setCategory('scifi');
      setDescription('');
      setTagsInput('Roleplay, Adventure');
      setSystemPrompt('Kamu adalah karakter roleplay...');
      setGreetingMessage('*Tersenyum menyapamu.* "Halo, ada yang bisa kubantu?"');
      setScenario('Di sebuah kafe futuristik yang tenang.');
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
        content: 'Fakta latar belakang yang akan diinjeksikan saat kata kunci disebut...',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] glass-panel rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-white/10">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">
                {editingCharacter ? `Edit Karakter: ${editingCharacter.name}` : 'Studio Pembuat Karakter'}
              </h2>
              <p className="text-xs text-zinc-400">Rancang kepribadian, skenario, dan format roleplay karaktermu</p>
            </div>
          </div>
          <button
            onClick={() => setIsCharacterModalOpen(false)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/5 overflow-x-auto">
          {[
            { id: 'basic', label: '1. Profil Dasar', icon: User },
            { id: 'personality', label: '2. Kepribadian & Prompt', icon: Bot },
            { id: 'scenario', label: '3. Skenario & Dialog', icon: MessageSquare },
            { id: 'lore', label: '4. Lorebook & Memori', icon: BookOpen },
            { id: 'model', label: '5. Model Override', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Nama Karakter <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Kaelen sang Pemburu Naga"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm bg-zinc-900 cursor-pointer"
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
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Tagline Singkat</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Contoh: Penyihir es misterius dari kerajaan utara"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Deskripsi Lengkap / Backstory</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Latar belakang karakter, asal usul, motif, dan detail penampilan..."
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm resize-none"
                />
              </div>

              {/* Avatar URL & Preset Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">URL Avatar Gambar</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                    <img src={avatar || PRESET_AVATARS[0]} alt="Avatar preview" className="w-full h-full object-cover" />
                  </div>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-4 py-2.5 rounded-xl glass-input text-sm"
                  />
                </div>

                <p className="text-[11px] text-zinc-400 mt-2">Pilih cepat dari avatar preset:</p>
                <div className="flex items-center gap-2 mt-1.5 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((presetUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(presetUrl)}
                      className={`w-10 h-10 rounded-xl overflow-hidden border transition-all shrink-0 cursor-pointer ${
                        avatar === presetUrl ? 'ring-2 ring-cyan-400 border-transparent scale-105' : 'border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={presetUrl} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Tags (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Cyberpunk, Netrunner, Jakarta, Hacker"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>
            </div>
          )}

          {activeTab === 'personality' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
                💡 <strong>Tips:</strong> Gunakan placeholder <code>{'{{char}}'}</code> untuk nama karakter dan <code>{'{{user}}'}</code> untuk nama pemain.
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  System Prompt (Instruksi Kepribadian & Gaya Bicara)
                </label>
                <textarea
                  rows={6}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Kamu adalah {{char}}. Kepribadianmu: sarkastik, cerdas, tidak suka basa-basi..."
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Pesan Pembuka (Greeting Message) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={5}
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  placeholder="*Melihatmu melangkah masuk ke dalam ruangan.* 'Selamat datang, {{user}}. Duduklah.'"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Pesan pertama yang akan langsung dikirim oleh karakter ketika memulai sesi chat baru.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'scenario' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Skenario & Latar Tempat</label>
                <textarea
                  rows={3}
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="Di sebuah safehouse di sudut gang gelap Neo-Jakarta saat hujan asam..."
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Contoh Dialog (Few-shot Examples)
                </label>
                <textarea
                  rows={6}
                  value={exampleDialogue}
                  onChange={(e) => setExampleDialogue(e.target.value)}
                  placeholder="<START>&#10;{{user}}: 'Bisa bantu aku?'&#10;{{char}}: *Menghela nafas.* 'Tergantung berapa bayarannya.'"
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono"
                />
              </div>
            </div>
          )}

          {activeTab === 'lore' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Lorebook / Memori Kontekstual</h3>
                  <p className="text-xs text-zinc-400">
                    Informasi tambahan yang otomatis diinjeksikan saat kata kunci tertentu muncul di obrolan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddLoreEntry}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Entri
                </button>
              </div>

              {lorebook.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                  <BookOpen className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">Belum ada memori Lorebook. Klik tombol &quot;Tambah Entri&quot;.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lorebook.map((entry, index) => (
                    <div key={entry.id} className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-cyan-400">Entri #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLoreEntry(entry.id)}
                          className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Kata Kunci Trigger (pisahkan dengan koma):
                        </label>
                        <input
                          type="text"
                          value={entry.keys.join(', ')}
                          onChange={(e) => handleUpdateLoreKeys(entry.id, e.target.value)}
                          placeholder="pedang kuno, naga, istana hitam"
                          className="w-full px-3 py-1.5 rounded-xl glass-input text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Isi Pengetahuan / Lore yang diinjeksikan:
                        </label>
                        <textarea
                          rows={2}
                          value={entry.content}
                          onChange={(e) => handleUpdateLoreContent(entry.id, e.target.value)}
                          placeholder="Pedang kuno itu dibuat oleh ras dwarven 1000 tahun silam..."
                          className="w-full px-3 py-1.5 rounded-xl glass-input text-xs resize-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'model' && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Kustomisasi model khusus untuk karakter ini (opsional). Jika dikosongkan, karakter akan menggunakan model default dari Pengaturan Umum.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Custom Provider Override</label>
                  <select
                    value={customProvider}
                    onChange={(e) => setCustomProvider(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm bg-zinc-900 cursor-pointer"
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
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Model ID Spesifik</label>
                  <input
                    type="text"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="Contoh: deepseek/deepseek-r1 atau gemini-2.5-flash"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono"
                  />
                </div>
              </div>

              {/* Sliders */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1">
                    <span>Temperature (Kreativitas): {temperature}</span>
                    <span className="text-zinc-400">{temperature > 0.8 ? 'Sangat Ekspresif' : 'Stabil & Terarah'}</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={1.5}
                    step={0.05}
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1">
                    <span>Max Output Tokens: {maxTokens}</span>
                    <span className="text-zinc-400">~{Math.round(maxTokens * 0.75)} kata per respon</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={3000}
                    step={100}
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-white/10 flex items-center justify-end gap-3 bg-zinc-950/80">
          <button
            type="button"
            onClick={() => setIsCharacterModalOpen(false)}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Karakter</span>
          </button>
        </div>
      </div>
    </div>
  );
}

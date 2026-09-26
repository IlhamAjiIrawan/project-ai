'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/db';
import { ApiSettings, ProviderType, AppBackupData } from '@/types';
import {
  Key,
  Sliders,
  Volume2,
  Database,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Save,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  Bot,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Play,
} from 'lucide-react';
import { POPULAR_MODELS } from '@/lib/providers/types';
import { downloadJson, readJsonFile } from '@/lib/utils';
import { PRESET_CHARACTERS, PRESET_PERSONAS } from '@/lib/presets';

export default function SettingsHubPage() {
  const { settings, updateSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState<'keys' | 'models' | 'tts' | 'data'>('keys');

  // Form local states
  const [form, setForm] = useState<ApiSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleSave = async () => {
    await updateSettings(form);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const toggleKeyVisibility = (keyName: string) => {
    setShowKeys((prev) => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const handleTestVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance('Halo! Ini adalah contoh suara roleplay interaktif.');
    if (form.ttsVoice) {
      const selected = availableVoices.find((v) => v.name === form.ttsVoice);
      if (selected) utterance.voice = selected;
    }
    utterance.rate = form.ttsRate;
    utterance.pitch = form.ttsPitch;
    window.speechSynthesis.speak(utterance);
  };

  const handleExportAllBackup = async () => {
    const characters = await db.characters.toArray();
    const sessions = await db.chatSessions.toArray();
    const messages = await db.chatMessages.toArray();
    const personas = await db.personas.toArray();

    // Sanitize API keys from backup to prevent credential leaks
    const sanitizedSettings: ApiSettings = {
      ...form,
      geminiApiKey: '',
      openRouterApiKey: '',
      groqApiKey: '',
      openaiApiKey: '',
      customApiKey: '',
    };

    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      characters,
      sessions,
      messages,
      personas,
      settings: sanitizedSettings,
    };

    downloadJson(`ai_roleplay_backup_${Date.now()}.json`, backupData);
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await readJsonFile<AppBackupData>(file);
      if (!data.characters && !data.messages) {
        alert('File backup tidak valid.');
        return;
      }

      if (confirm('Impor backup ini? Data saat ini akan digabungkan/diperbarui.')) {
        if (data.characters) await db.characters.bulkPut(data.characters);
        if (data.personas) await db.personas.bulkPut(data.personas);
        if (data.sessions) await db.chatSessions.bulkPut(data.sessions);
        if (data.messages) await db.chatMessages.bulkPut(data.messages);
        if (data.settings) await updateSettings(data.settings);
        alert('Backup data berhasil dipulihkan!');
      }
    } catch (err: any) {
      alert(`Gagal memulihkan backup: ${err.message}`);
    } finally {
      if (backupFileInputRef.current) backupFileInputRef.current.value = '';
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Pulihkan karakter & persona default? Karakter yang sudah kamu buat tidak akan dihapus.')) {
      await db.characters.bulkPut(PRESET_CHARACTERS);
      await db.personas.bulkPut(PRESET_PERSONAS);
      alert('Karakter dan persona default berhasil dimuat ulang.');
    }
  };

  const applyParameterPreset = (type: 'creative' | 'novelist' | 'rpg' | 'precise') => {
    switch (type) {
      case 'creative':
        setForm({ ...form, temperature: 1.0, topP: 0.95, frequencyPenalty: 0.2, presencePenalty: 0.2 });
        break;
      case 'novelist':
        setForm({ ...form, temperature: 0.85, topP: 0.9, frequencyPenalty: 0.15, presencePenalty: 0.1, maxTokens: 1500 });
        break;
      case 'rpg':
        setForm({ ...form, temperature: 0.75, topP: 0.85, frequencyPenalty: 0.05, presencePenalty: 0.0, maxTokens: 1200 });
        break;
      case 'precise':
        setForm({ ...form, temperature: 0.4, topP: 0.7, frequencyPenalty: 0.0, presencePenalty: 0.0 });
        break;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-7 max-w-5xl mx-auto w-full">
      {/* Settings Header Banner */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Engine & API Configuration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Pengaturan & API Hub
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
              Kelola kunci API untuk berbagai penyedia AI, atur parameter respon cerita (temperatur, token), suara pembaca (TTS), dan cadangkan riwayat roleplay.
            </p>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs md:text-sm shadow-lg shadow-cyan-500/25 transition-all cursor-pointer self-start md:self-auto"
          >
            {saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-950" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Settings Tabs & Content Container */}
      <div className="glass-card rounded-3xl p-6 md:p-8 border border-white/10 shadow-xl space-y-6">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('keys')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'keys'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API Keys & Provider</span>
          </button>

          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'models'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Model & Parameter</span>
          </button>

          <button
            onClick={() => setActiveTab('tts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'tts'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Suara (TTS)</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'data'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Backup Data</span>
          </button>
        </div>

        {/* Tab 1: API Keys */}
        {activeTab === 'keys' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Kunci API disimpan secara lokal di browser Anda (IndexedDB) dan tidak dikirim ke server kami.
              </p>
              <p className="text-zinc-400">
                Pilih provider yang Anda inginkan (misal Google Gemini gratis atau OpenRouter) dan masukkan API key di bawah.
              </p>
            </div>

            {/* Google Gemini */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                    G
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Google Gemini API</h4>
                    <p className="text-[11px] text-zinc-400">Direkomendasikan (Cepat, Cerdas, dan Tersedia Kuota Gratis)</p>
                  </div>
                </div>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                >
                  <span>Dapatkan Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <input
                  type={showKeys['gemini'] ? 'text' : 'password'}
                  value={form.geminiApiKey}
                  onChange={(e) => setForm({ ...form, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full pl-3.5 pr-10 py-2 rounded-xl glass-input text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => toggleKeyVisibility('gemini')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showKeys['gemini'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* OpenRouter */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                    OR
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">OpenRouter API</h4>
                    <p className="text-[11px] text-zinc-400">Akses ke Claude 3.5, Llama 3, DeepSeek, Mistral, dll.</p>
                  </div>
                </div>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                >
                  <span>Dapatkan Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <input
                  type={showKeys['openrouter'] ? 'text' : 'password'}
                  value={form.openRouterApiKey}
                  onChange={(e) => setForm({ ...form, openRouterApiKey: e.target.value })}
                  placeholder="sk-or-v1-..."
                  className="w-full pl-3.5 pr-10 py-2 rounded-xl glass-input text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => toggleKeyVisibility('openrouter')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showKeys['openrouter'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Groq */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                    GQ
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Groq API</h4>
                    <p className="text-[11px] text-zinc-400">Kecepatan inferensi super instan (LPU Engine)</p>
                  </div>
                </div>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                >
                  <span>Dapatkan Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <input
                  type={showKeys['groq'] ? 'text' : 'password'}
                  value={form.groqApiKey}
                  onChange={(e) => setForm({ ...form, groqApiKey: e.target.value })}
                  placeholder="gsk_..."
                  className="w-full pl-3.5 pr-10 py-2 rounded-xl glass-input text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => toggleKeyVisibility('groq')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showKeys['groq'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* OpenAI */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    OA
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">OpenAI API</h4>
                    <p className="text-[11px] text-zinc-400">GPT-4o, GPT-4o-mini, GPT-3.5</p>
                  </div>
                </div>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                >
                  <span>Dapatkan Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <input
                  type={showKeys['openai'] ? 'text' : 'password'}
                  value={form.openaiApiKey}
                  onChange={(e) => setForm({ ...form, openaiApiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full pl-3.5 pr-10 py-2 rounded-xl glass-input text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => toggleKeyVisibility('openai')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showKeys['openai'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Custom OpenAI-Compatible (Ollama, LM Studio, vLLM) */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    CP
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Custom Endpoint (Ollama / LM Studio / Local LLM)</h4>
                    <p className="text-[11px] text-zinc-400">Kompatibel dengan API format OpenAI</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        customBaseUrl: 'http://localhost:11434/v1',
                        customApiKey: 'ollama',
                        customModelName: form.customModelName || 'gemma2:27b',
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-medium transition-all cursor-pointer"
                  >
                    Set URL Ollama
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        customBaseUrl: 'http://localhost:1234/v1',
                        customApiKey: 'lm-studio',
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-medium transition-all cursor-pointer"
                  >
                    Set URL LM Studio
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
                <p className="font-semibold">⚠️ Catatan Penggunaan Ollama:</p>
                <p className="text-zinc-300">
                  • Gunakan Base URL: <code className="bg-black/40 px-1 py-0.5 rounded text-amber-200">http://localhost:11434/v1</code> (jangan gunakan <code className="line-through text-rose-300">https://ollama.com</code>).
                  <br />
                  • Pastikan aplikasi Ollama sedang berjalan di PC Anda dan model sudah di-download (contoh: <code className="text-cyan-300">ollama run gemma2:27b</code> atau <code className="text-cyan-300">ollama run llama3.2</code>).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Base URL</label>
                  <input
                    type="text"
                    value={form.customBaseUrl}
                    onChange={(e) => setForm({ ...form, customBaseUrl: e.target.value })}
                    placeholder="http://localhost:11434/v1"
                    className="w-full px-3 py-1.5 rounded-xl glass-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">API Key (Opsional)</label>
                  <input
                    type="password"
                    value={form.customApiKey}
                    onChange={(e) => setForm({ ...form, customApiKey: e.target.value })}
                    placeholder="ollama / bearer token"
                    className="w-full px-3 py-1.5 rounded-xl glass-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Model Name</label>
                  <input
                    type="text"
                    value={form.customModelName}
                    onChange={(e) => setForm({ ...form, customModelName: e.target.value })}
                    placeholder="gemma2:27b, llama3.2, mistral, dll."
                    className="w-full px-3 py-1.5 rounded-xl glass-input text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Models & Hyperparameters */}
        {activeTab === 'models' && (
          <div className="space-y-6">
            {/* Default Provider & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Provider Default</label>
                <select
                  value={form.defaultProvider}
                  onChange={(e) => {
                    const newProv = e.target.value as ProviderType;
                    const defaultForProv = POPULAR_MODELS.find((m) => m.provider === newProv)?.id || '';
                    setForm({ ...form, defaultProvider: newProv, defaultModel: defaultForProv });
                  }}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-medium cursor-pointer"
                >
                  <option value="gemini" className="bg-zinc-900 text-white">Google Gemini</option>
                  <option value="openrouter" className="bg-zinc-900 text-white">OpenRouter</option>
                  <option value="groq" className="bg-zinc-900 text-white">Groq</option>
                  <option value="openai" className="bg-zinc-900 text-white">OpenAI</option>
                  <option value="custom" className="bg-zinc-900 text-white">Custom / Local LLM</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Model Default</label>
                <select
                  value={form.defaultModel}
                  onChange={(e) => setForm({ ...form, defaultModel: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-medium cursor-pointer"
                >
                  {POPULAR_MODELS.filter((m) => m.provider === form.defaultProvider).map((m) => (
                    <option key={m.id} value={m.id} className="bg-zinc-900 text-white">
                      {m.name} ({m.id})
                    </option>
                  ))}
                  {form.defaultProvider === 'custom' && (
                    <option value={form.customModelName || 'custom'} className="bg-zinc-900 text-white">
                      {form.customModelName || 'Custom Model'}
                    </option>
                  )}
                </select>
              </div>
            </div>

            {/* Hyperparameter Quick Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">Preset Gaya Respon Cepat</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => applyParameterPreset('novelist')}
                  className="p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800 border border-white/5 text-left transition-all cursor-pointer"
                >
                  <p className="font-semibold text-xs text-white">Novelist / Story</p>
                  <p className="text-[10px] text-zinc-400">Deskriptif & kaya emosi</p>
                </button>
                <button
                  type="button"
                  onClick={() => applyParameterPreset('creative')}
                  className="p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800 border border-white/5 text-left transition-all cursor-pointer"
                >
                  <p className="font-semibold text-xs text-white">Kreatif & Bebas</p>
                  <p className="text-[10px] text-zinc-400">Variatif & tak terduga</p>
                </button>
                <button
                  type="button"
                  onClick={() => applyParameterPreset('rpg')}
                  className="p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800 border border-white/5 text-left transition-all cursor-pointer"
                >
                  <p className="font-semibold text-xs text-white">RPG Master</p>
                  <p className="text-[10px] text-zinc-400">Logis & terarah</p>
                </button>
                <button
                  type="button"
                  onClick={() => applyParameterPreset('precise')}
                  className="p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800 border border-white/5 text-left transition-all cursor-pointer"
                >
                  <p className="font-semibold text-xs text-white">Presisi</p>
                  <p className="text-[10px] text-zinc-400">Ketat pada prompt</p>
                </button>
              </div>
            </div>

            {/* Parameter Sliders */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-zinc-300">Temperature (Kreativitas)</span>
                  <span className="font-mono text-cyan-400">{form.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-zinc-300">Max Tokens (Panjang Balasan Maksimal)</span>
                  <span className="font-mono text-cyan-400">{form.maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="4000"
                  step="100"
                  value={form.maxTokens}
                  onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-zinc-300">Top P</span>
                  <span className="font-mono text-cyan-400">{form.topP}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={form.topP}
                  onChange={(e) => setForm({ ...form, topP: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: TTS (Text-to-Speech) */}
        {activeTab === 'tts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/60 border border-white/5">
              <div>
                <h4 className="font-bold text-sm text-white">Aktifkan Text-to-Speech (TTS)</h4>
                <p className="text-xs text-zinc-400">Otomatis membacakan dialog karakter dengan audio browser</p>
              </div>
              <input
                type="checkbox"
                checked={form.enableTTS}
                onChange={(e) => setForm({ ...form, enableTTS: e.target.checked })}
                className="w-5 h-5 accent-cyan-400 cursor-pointer rounded"
              />
            </div>

            {form.enableTTS && (
              <div className="space-y-4 p-4 rounded-2xl bg-zinc-900/40 border border-white/5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Pilih Suara (Web Speech API)</label>
                  <select
                    value={form.ttsVoice}
                    onChange={(e) => setForm({ ...form, ttsVoice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs font-medium cursor-pointer"
                  >
                    <option value="">Default Suara Sistem Browser</option>
                    {availableVoices.map((v, i) => (
                      <option key={i} value={v.name} className="bg-zinc-900 text-white">
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-zinc-300">Kecepatan Bicara (Rate)</span>
                      <span className="font-mono text-cyan-400">{form.ttsRate}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={form.ttsRate}
                      onChange={(e) => setForm({ ...form, ttsRate: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-zinc-300">Nada Suara (Pitch)</span>
                      <span className="font-mono text-cyan-400">{form.ttsPitch}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={form.ttsPitch}
                      onChange={(e) => setForm({ ...form, ttsPitch: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleTestVoice}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-300 text-xs font-medium cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Uji Coba Suara</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Backup & Data */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-3">
              <div>
                <h4 className="font-bold text-sm text-white">Cadangkan & Pulihkan Semua Data</h4>
                <p className="text-xs text-zinc-400">
                  Ekspor seluruh karakter, persona, riwayat chat, dan pengaturan ke satu file JSON cadangan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExportAllBackup}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-semibold text-xs cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Ekspor Backup Lengkap (.json)</span>
                </button>

                <button
                  type="button"
                  onClick={() => backupFileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 text-xs font-semibold cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Pulihkan dari Backup JSON</span>
                </button>
                <input
                  ref={backupFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-3">
              <div>
                <h4 className="font-bold text-sm text-white">Muat Ulang Karakter Preset Default</h4>
                <p className="text-xs text-zinc-400">
                  Jika Anda kehilangan karakter bawaan atau ingin memperbarui template awal.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/10 text-xs font-medium cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Muat Ulang Preset Bawaan</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

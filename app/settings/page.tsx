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
  Save,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Play,
} from 'lucide-react';
import { POPULAR_MODELS } from '@/lib/providers/types';
import { downloadJson, readJsonFile } from '@/lib/utils';
import { PRESET_CHARACTERS, PRESET_PERSONAS } from '@/lib/presets';

export default function SettingsHubPage() {
  const { settings, updateSettings, theme } = useAppStore();
  const [activeTab, setActiveTab] = useState<'keys' | 'models' | 'tts' | 'data'>('keys');

  const [form, setForm] = useState<ApiSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';

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
    setTimeout(() => setSaveSuccess(false), 2000);
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
    if (confirm('Pulihkan karakter & persona default? Karakter buatanmu tidak akan dihapus.')) {
      await db.characters.bulkPut(PRESET_CHARACTERS);
      await db.personas.bulkPut(PRESET_PERSONAS);
      alert('Data preset bawaan berhasil dimuat ulang.');
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
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
      {/* Header Banner */}
      <div className={`rounded-2xl p-6 border transition-colors ${
        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Pengaturan & API Hub
            </h1>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Kelola kunci API, preferensi model, parameter respon cerita, dan cadangan data.
            </p>
          </div>

          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-colors cursor-pointer self-start md:self-auto ${
              isDark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
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

      {/* Tabs Container */}
      <div className={`rounded-2xl p-5 md:p-6 border space-y-6 transition-colors ${
        isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
      }`}>
        {/* Tab Navigation */}
        <div className={`flex items-center gap-1.5 border-b pb-3 overflow-x-auto scrollbar-none ${
          isDark ? 'border-zinc-800' : 'border-zinc-100'
        }`}>
          <button
            onClick={() => setActiveTab('keys')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              activeTab === 'keys'
                ? isDark ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold' : 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                : isDark ? 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200' : 'bg-transparent text-zinc-600 border-transparent hover:text-zinc-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys</span>
          </button>

          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              activeTab === 'models'
                ? isDark ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold' : 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                : isDark ? 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200' : 'bg-transparent text-zinc-600 border-transparent hover:text-zinc-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Model & Parameter</span>
          </button>

          <button
            onClick={() => setActiveTab('tts')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              activeTab === 'tts'
                ? isDark ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold' : 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                : isDark ? 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200' : 'bg-transparent text-zinc-600 border-transparent hover:text-zinc-900'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Suara (TTS)</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              activeTab === 'data'
                ? isDark ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold' : 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                : isDark ? 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200' : 'bg-transparent text-zinc-600 border-transparent hover:text-zinc-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Backup Data</span>
          </button>
        </div>

        {/* Tab 1: API Keys */}
        {activeTab === 'keys' && (
          <div className="space-y-4">
            <div className={`p-3 rounded-xl border text-xs ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
            }`}>
              Kunci API disimpan secara lokal di browser Anda (IndexedDB) dan tidak dikirim ke server pihak ketiga.
            </div>

            {/* Google Gemini */}
            <div className={`p-4 rounded-xl border space-y-2.5 ${
              isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50/60 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs sm:text-sm">Google Gemini</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-700'}`}>
                    Rekomendasi
                  </span>
                </div>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1 text-[11px] hover:underline ${
                    isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
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
                  className={`w-full pl-3 pr-9 py-2 rounded-lg text-xs font-mono border ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => toggleKeyVisibility('gemini')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showKeys['gemini'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* OpenRouter */}
            <div className={`p-4 rounded-xl border space-y-2.5 ${
              isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50/60 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs sm:text-sm">OpenRouter API</span>
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1 text-[11px] hover:underline ${
                    isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
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
                  className={`w-full pl-3 pr-9 py-2 rounded-lg text-xs font-mono border ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => toggleKeyVisibility('openrouter')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showKeys['openrouter'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Groq */}
            <div className={`p-4 rounded-xl border space-y-2.5 ${
              isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50/60 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs sm:text-sm">Groq API</span>
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1 text-[11px] hover:underline ${
                    isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
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
                  className={`w-full pl-3 pr-9 py-2 rounded-lg text-xs font-mono border ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => toggleKeyVisibility('groq')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showKeys['groq'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* OpenAI */}
            <div className={`p-4 rounded-xl border space-y-2.5 ${
              isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50/60 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs sm:text-sm">OpenAI API</span>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-1 text-[11px] hover:underline ${
                    isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
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
                  className={`w-full pl-3 pr-9 py-2 rounded-lg text-xs font-mono border ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => toggleKeyVisibility('openai')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  {showKeys['openai'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Custom Endpoint */}
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50/60 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-semibold text-xs sm:text-sm">Custom Endpoint (Ollama / LM Studio)</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        customBaseUrl: 'https://ollama.com/v1',
                        customApiKey: '',
                        customModelName: form.customModelName || 'gemma4:27b',
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    Ollama Cloud
                  </button>
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
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    Ollama Lokal
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
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700' : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    LM Studio
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] block mb-1 text-zinc-400">Base URL</label>
                  <input
                    type="text"
                    value={form.customBaseUrl}
                    onChange={(e) => setForm({ ...form, customBaseUrl: e.target.value })}
                    placeholder="http://localhost:11434/v1"
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] block mb-1 text-zinc-400">API Key</label>
                  <input
                    type="password"
                    value={form.customApiKey}
                    onChange={(e) => setForm({ ...form, customApiKey: e.target.value })}
                    placeholder="ollama / key"
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[11px] block mb-1 text-zinc-400">Model Name</label>
                  <input
                    type="text"
                    value={form.customModelName}
                    onChange={(e) => setForm({ ...form, customModelName: e.target.value })}
                    placeholder="gemma2:27b, llama3.2"
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Models & Hyperparameters */}
        {activeTab === 'models' && (
          <div className="space-y-5">
            {/* Default Provider & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Provider Utama</label>
                <select
                  value={form.defaultProvider}
                  onChange={(e) => {
                    const newProv = e.target.value as ProviderType;
                    const defaultForProv = POPULAR_MODELS.find((m) => m.provider === newProv)?.id || '';
                    setForm({ ...form, defaultProvider: newProv, defaultModel: defaultForProv });
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer border ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="groq">Groq</option>
                  <option value="openai">OpenAI</option>
                  <option value="custom">Custom / Local LLM</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Model Utama</label>
                <select
                  value={form.defaultModel}
                  onChange={(e) => setForm({ ...form, defaultModel: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer border ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                  }`}
                >
                  {POPULAR_MODELS.filter((m) => m.provider === form.defaultProvider).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id})
                    </option>
                  ))}
                  {form.defaultProvider === 'custom' && (
                    <option value={form.customModelName || 'custom'}>
                      {form.customModelName || 'Custom Model'}
                    </option>
                  )}
                </select>
              </div>
            </div>

            {/* Hyperparameter Quick Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold">Preset Gaya Cerita</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => applyParameterPreset('novelist')}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    isDark ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <p className="font-semibold text-xs">Novelist</p>
                  <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Deskriptif & kaya</p>
                </button>
                <button
                  type="button"
                  onClick={() => applyParameterPreset('creative')}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    isDark ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <p className="font-semibold text-xs">Kreatif</p>
                  <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Variatif & bebas</p>
                </button>
                <button
                  type="button"
                  onClick={() => applyParameterPreset('rpg')}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    isDark ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <p className="font-semibold text-xs">RPG Master</p>
                  <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Logis & terarah</p>
                </button>
                <button
                  type="button"
                  onClick={() => applyParameterPreset('precise')}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    isDark ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <p className="font-semibold text-xs">Presisi</p>
                  <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Ketat pada prompt</p>
                </button>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Temperature</span>
                  <span className="font-mono">{form.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                  className="w-full cursor-pointer accent-zinc-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Max Tokens</span>
                  <span className="font-mono">{form.maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="4000"
                  step="100"
                  value={form.maxTokens}
                  onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-zinc-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">Top P</span>
                  <span className="font-mono">{form.topP}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={form.topP}
                  onChange={(e) => setForm({ ...form, topP: parseFloat(e.target.value) })}
                  className="w-full cursor-pointer accent-zinc-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: TTS (Text-to-Speech) */}
        {activeTab === 'tts' && (
          <div className="space-y-5">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50/60 border-zinc-200'
            }`}>
              <div>
                <h4 className="font-semibold text-xs sm:text-sm">Aktifkan Text-to-Speech (TTS)</h4>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Membacakan dialog karakter menggunakan Web Speech API browser
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.enableTTS}
                onChange={(e) => setForm({ ...form, enableTTS: e.target.checked })}
                className="w-4 h-4 cursor-pointer rounded"
              />
            </div>

            {form.enableTTS && (
              <div className={`space-y-4 p-4 rounded-xl border ${
                isDark ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Pilih Suara</label>
                  <select
                    value={form.ttsVoice}
                    onChange={(e) => setForm({ ...form, ttsVoice: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-medium cursor-pointer border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  >
                    <option value="">Default Suara Browser</option>
                    {availableVoices.map((v, i) => (
                      <option key={i} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">Kecepatan (Rate)</span>
                      <span className="font-mono">{form.ttsRate}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={form.ttsRate}
                      onChange={(e) => setForm({ ...form, ttsRate: parseFloat(e.target.value) })}
                      className="w-full cursor-pointer accent-zinc-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">Nada (Pitch)</span>
                      <span className="font-mono">{form.ttsPitch}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={form.ttsPitch}
                      onChange={(e) => setForm({ ...form, ttsPitch: parseFloat(e.target.value) })}
                      className="w-full cursor-pointer accent-zinc-500"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleTestVoice}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-100'
                    }`}
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
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50/60 border-zinc-200'
            }`}>
              <div>
                <h4 className="font-semibold text-xs sm:text-sm">Cadangkan & Pulihkan Data</h4>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Ekspor seluruh karakter, persona, riwayat chat, dan pengaturan ke file JSON.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExportAllBackup}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer ${
                    isDark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>Ekspor Backup (.json)</span>
                </button>

                <button
                  type="button"
                  onClick={() => backupFileInputRef.current?.click()}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium cursor-pointer ${
                    isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Pulihkan Backup</span>
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

            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50/60 border-zinc-200'
            }`}>
              <div>
                <h4 className="font-semibold text-xs sm:text-sm">Muat Ulang Preset Bawaan</h4>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Kembalikan template karakter dan persona bawaan ke awal.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetDefaults}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium cursor-pointer ${
                  isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang Preset</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

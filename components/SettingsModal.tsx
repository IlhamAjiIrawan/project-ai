'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/db';
import { ApiSettings, ProviderType, AppBackupData, ResponseLengthType } from '@/types';
import {
  X,
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

export function SettingsModal() {
  const { isSettingsOpen, setIsSettingsOpen, settings, updateSettings, theme } = useAppStore();
  const [activeTab, setActiveTab] = useState<'keys' | 'models' | 'tts' | 'data'>('keys');

  const [form, setForm] = useState<ApiSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    setForm(settings);
  }, [settings, isSettingsOpen]);

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

  if (!isSettingsOpen) return null;

  const handleSave = async () => {
    await updateSettings(form);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const toggleKeyVisibility = (keyName: string) => {
    setShowKeys((prev) => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const applyParameterPreset = (type: 'novelist' | 'creative' | 'rpg' | 'precise') => {
    switch (type) {
      case 'novelist':
        setForm({
          ...form,
          temperature: 0.85,
          responseLength: 'long',
          maxTokens: 1500,
          topP: 0.90,
          topA: 0.20,
          topK: 40,
          repetitionPenalty: 1.10,
        });
        break;
      case 'creative':
        setForm({
          ...form,
          temperature: 1.05,
          responseLength: 'medium',
          maxTokens: 1200,
          topP: 0.95,
          topA: 0.00,
          topK: 60,
          repetitionPenalty: 1.05,
        });
        break;
      case 'rpg':
        setForm({
          ...form,
          temperature: 0.70,
          responseLength: 'medium',
          maxTokens: 1000,
          topP: 0.85,
          topA: 0.15,
          topK: 40,
          repetitionPenalty: 1.12,
        });
        break;
      case 'precise':
        setForm({
          ...form,
          temperature: 0.40,
          responseLength: 'short',
          maxTokens: 800,
          topP: 0.80,
          topA: 0.30,
          topK: 30,
          repetitionPenalty: 1.00,
        });
        break;
    }
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
    const memories = await db.sessionMemories.toArray();

    const sanitizedSettings: ApiSettings = {
      ...form,
      geminiApiKey: '',
      openRouterApiKey: '',
      groqApiKey: '',
      openaiApiKey: '',
      customApiKey: '',
    };

    const backupData: AppBackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      characters,
      sessions,
      messages,
      personas,
      memories,
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
        if (data.memories) await db.sessionMemories.bulkPut(data.memories);
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
    if (confirm('Pulihkan karakter dan persona bawaan ke awal?')) {
      await db.characters.bulkPut(PRESET_CHARACTERS);
      await db.personas.bulkPut(PRESET_PERSONAS);
      alert('Data preset berhasil dimuat ulang!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`relative w-full max-w-3xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border transition-colors ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
          <div>
            <h2 className="text-base sm:text-lg font-bold">Pengaturan API & Engine AI</h2>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Konfigurasi API Keys, Model Utama, Suara TTS, dan Backup
            </p>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex items-center gap-1 px-4 sm:px-5 pt-2.5 border-b overflow-x-auto scrollbar-none ${
          isDark ? 'border-zinc-800' : 'border-zinc-100'
        }`}>
          {[
            { id: 'keys', label: '1. API Keys', icon: Key },
            { id: 'models', label: '2. Model & Parameter', icon: Sliders },
            { id: 'tts', label: '3. Suara (TTS)', icon: Volume2 },
            { id: 'data', label: '4. Backup Data', icon: Database },
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

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
          {activeTab === 'keys' && (
            <div className="space-y-3.5">
              <div className={`p-3 rounded-xl border text-xs ${
                isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
              }`}>
                Kunci API disimpan secara lokal di browser Anda (IndexedDB) dan tidak dikirim ke server pihak ketiga.
              </div>

              {/* Gemini */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">Google Gemini API</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-zinc-400 hover:underline flex items-center gap-1"
                  >
                    Dapatkan Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showKeys['gemini'] ? 'text' : 'password'}
                    value={form.geminiApiKey}
                    onChange={(e) => setForm({ ...form, geminiApiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className={`w-full pl-3 pr-8 py-2 rounded-xl text-xs font-mono border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('gemini')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showKeys['gemini'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* OpenRouter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">OpenRouter API</span>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-zinc-400 hover:underline flex items-center gap-1"
                  >
                    Dapatkan Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showKeys['openrouter'] ? 'text' : 'password'}
                    value={form.openRouterApiKey}
                    onChange={(e) => setForm({ ...form, openRouterApiKey: e.target.value })}
                    placeholder="sk-or-v1-..."
                    className={`w-full pl-3 pr-8 py-2 rounded-xl text-xs font-mono border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('openrouter')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showKeys['openrouter'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Groq */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">Groq API</span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-zinc-400 hover:underline flex items-center gap-1"
                  >
                    Dapatkan Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showKeys['groq'] ? 'text' : 'password'}
                    value={form.groqApiKey}
                    onChange={(e) => setForm({ ...form, groqApiKey: e.target.value })}
                    placeholder="gsk_..."
                    className={`w-full pl-3 pr-8 py-2 rounded-xl text-xs font-mono border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('groq')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showKeys['groq'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* OpenAI */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">OpenAI API</span>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-zinc-400 hover:underline flex items-center gap-1"
                  >
                    Dapatkan Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showKeys['openai'] ? 'text' : 'password'}
                    value={form.openaiApiKey}
                    onChange={(e) => setForm({ ...form, openaiApiKey: e.target.value })}
                    placeholder="sk-..."
                    className={`w-full pl-3 pr-8 py-2 rounded-xl text-xs font-mono border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('openai')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showKeys['openai'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Custom Endpoint */}
              <div className={`p-3 rounded-xl border space-y-2.5 ${
                isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-semibold text-xs">Custom Endpoint (Ollama / Local)</span>
                  <div className="flex items-center gap-1">
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
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'
                      }`}
                    >
                      Ollama
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
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700'
                      }`}
                    >
                      LM Studio
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={form.customBaseUrl}
                    onChange={(e) => setForm({ ...form, customBaseUrl: e.target.value })}
                    placeholder="http://localhost:11434/v1"
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                  <input
                    type="text"
                    value={form.customModelName}
                    onChange={(e) => setForm({ ...form, customModelName: e.target.value })}
                    placeholder="Model name: gemma2:27b"
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Provider Utama</label>
                  <select
                    value={form.defaultProvider}
                    onChange={(e) => {
                      const newProvider = e.target.value as ProviderType;
                      const defaultForProvider = POPULAR_MODELS.find((m) => m.provider === newProvider);
                      setForm({
                        ...form,
                        defaultProvider: newProvider,
                        defaultModel: defaultForProvider ? defaultForProvider.id : form.defaultModel,
                      });
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
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      isDark ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <p className="font-semibold text-xs">Novelist</p>
                    <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Deskriptif & kaya narasi</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyParameterPreset('creative')}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      isDark ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <p className="font-semibold text-xs">Kreatif & Bebas</p>
                    <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Variatif & tak terduga</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyParameterPreset('rpg')}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      isDark ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    <p className="font-semibold text-xs">RPG Master</p>
                    <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Logis & seimbang</p>
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

              {/* 7 AI Parameters Section */}
              <div className={`p-4 rounded-xl border space-y-4 ${
                isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Konfigurasi Detail 7 Parameter AI
                </h3>

                {/* 1. Temperature */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1">
                      1. Temperature (Kreativitas):
                      <span className="font-mono text-zinc-400 font-normal">{form.temperature}</span>
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {form.temperature > 1.0 ? 'Sangat Bebas' : form.temperature >= 0.7 ? 'Seimbang (Cerita)' : 'Terfokus/Logis'}
                    </span>
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
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Mengatur keacakan pemilihan kata. Nilai tinggi membuat cerita lebih bervariasi.
                  </p>
                </div>

                {/* 2. Panjang Respon */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold">2. Target Panjang Respon:</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'short', label: 'Singkat', desc: '1-2 paragraf padat' },
                      { id: 'medium', label: 'Sedang', desc: '2-3 paragraf naratif' },
                      { id: 'long', label: 'Panjang / Novel', desc: '4+ paragraf deskriptif' },
                      { id: 'unlimited', label: 'Bebas', desc: 'Sesuai alur cerita' },
                    ].map((len) => (
                      <button
                        key={len.id}
                        type="button"
                        onClick={() => setForm({ ...form, responseLength: len.id as ResponseLengthType })}
                        className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                          (form.responseLength || 'medium') === len.id
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
                      <span className="font-mono text-zinc-400 font-normal">{form.maxTokens}</span>
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      ~{Math.round(form.maxTokens * 0.75)} kata
                    </span>
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
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Batas keras jumlah token balasan yang boleh dihasilkan AI dalam satu kali respons.
                  </p>
                </div>

                {/* 4. Top-P */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1">
                      4. Top-P / Nucleus Sampling:
                      <span className="font-mono text-zinc-400 font-normal">{form.topP ?? 0.95}</span>
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {Math.round((form.topP ?? 0.95) * 100)}% kandidat teratas
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={form.topP ?? 0.95}
                    onChange={(e) => setForm({ ...form, topP: parseFloat(e.target.value) })}
                    className="w-full cursor-pointer accent-zinc-500"
                  />
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Memilih kata dari kelompok teratas dengan total akumulasi probabilitas P.
                  </p>
                </div>

                {/* 5. Top-A */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1">
                      5. Top-A (Dynamic Cutoff):
                      <span className="font-mono text-zinc-400 font-normal">{form.topA ?? 0.0}</span>
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {(form.topA ?? 0.0) === 0 ? 'Nonaktif' : 'Aktif'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={form.topA ?? 0.0}
                    onChange={(e) => setForm({ ...form, topA: parseFloat(e.target.value) })}
                    className="w-full cursor-pointer accent-zinc-500"
                  />
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Memangkas kata jika probabilitas kata teratas dominan, mencegah balasan ngelantur.
                  </p>
                </div>

                {/* 6. Top-K */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1">
                      6. Top-K (Batas Jumlah Kandidat):
                      <span className="font-mono text-zinc-400 font-normal">{form.topK ?? 40}</span>
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {form.topK === 0 ? 'Semua kata' : `${form.topK ?? 40} kata teratas`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={form.topK ?? 40}
                    onChange={(e) => setForm({ ...form, topK: parseInt(e.target.value) })}
                    className="w-full cursor-pointer accent-zinc-500"
                  />
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Membatasi pilihan hanya ke sejumlah K kata terbaik sebelum sampling.
                  </p>
                </div>

                {/* 7. Repetition Penalty */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold flex items-center gap-1">
                      7. Repetition Penalty (Penalti Pengulangan):
                      <span className="font-mono text-zinc-400 font-normal">{form.repetitionPenalty ?? 1.1}</span>
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                      {(form.repetitionPenalty ?? 1.1) > 1.0 ? 'Mencegah Looping' : 'Normal'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.0"
                    step="0.05"
                    value={form.repetitionPenalty ?? 1.1}
                    onChange={(e) => setForm({ ...form, repetitionPenalty: parseFloat(e.target.value) })}
                    className="w-full cursor-pointer accent-zinc-500"
                  />
                  <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    Mencegah karakter mengulang kalimat atau frasa yang sama secara repetitif.
                  </p>
                </div>
              </div>

              {/* Stream toggle */}
              <div className={`flex items-center justify-between p-3 rounded-xl border ${
                isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div>
                  <h4 className="font-semibold text-xs">Streaming Respons</h4>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Menampilkan kata per kata secara real-time seperti mengetik
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.streamResponse}
                  onChange={(e) => setForm({ ...form, streamResponse: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'tts' && (
            <div className="space-y-3.5">
              <div className={`flex items-center justify-between p-3 rounded-xl border ${
                isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div>
                  <h4 className="font-semibold text-xs">Aktifkan Suara (TTS)</h4>
                  <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Membacakan respon dialog AI secara otomatis
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.enableTTS}
                  onChange={(e) => setForm({ ...form, enableTTS: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                />
              </div>

              {form.enableTTS && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Pilih Suara</label>
                    <select
                      value={form.ttsVoice}
                      onChange={(e) => setForm({ ...form, ttsVoice: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border text-xs cursor-pointer ${
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

                  <button
                    type="button"
                    onClick={handleTestVoice}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                      isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Uji Coba Suara</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-3.5">
              <div className={`p-4 rounded-xl border space-y-2.5 ${
                isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <h4 className="font-semibold text-xs sm:text-sm">Cadangkan Data</h4>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Simpan seluruh data karakter, persona, dan chat ke file JSON.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExportAllBackup}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      isDark ? 'bg-zinc-100 text-zinc-950 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Backup</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => backupFileInputRef.current?.click()}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                      isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pulihkan File</span>
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

              <div className={`p-4 rounded-xl border space-y-2 ${
                isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <h4 className="font-semibold text-xs">Reset Karakter Preset</h4>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Muat ulang template karakter bawaan jika diperlukan.
                </p>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer ${
                    isDark ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Pulihkan Preset</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-between ${
          isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-100 bg-white'
        }`}>
          <div>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Tersimpan!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              Tutup
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
  );
}

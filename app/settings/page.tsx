'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/db';
import { ApiSettings, ProviderType, AppBackupData, ResponseLengthType } from '@/types';
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
  HelpCircle,
} from 'lucide-react';
import { POPULAR_MODELS } from '@/lib/providers/types';
import { downloadJson, readJsonFile } from '@/lib/utils';
import { PRESET_CHARACTERS, PRESET_PERSONAS } from '@/lib/presets';

export default function SettingsHubPage() {
  const { settings, updateSettings, theme } = useAppStore();
  const [activeTab, setActiveTab] = useState<'keys' | 'models' | 'tts' | 'data'>('models');

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
    if (confirm('Pulihkan karakter & persona default? Karakter buatanmu tidak akan dihapus.')) {
      await db.characters.bulkPut(PRESET_CHARACTERS);
      await db.personas.bulkPut(PRESET_PERSONAS);
      alert('Data preset bawaan berhasil dimuat ulang.');
    }
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
          contextLimit: 8192,
          ltmContextBudget: 1200,
          embeddingContextBudget: 800,
          chatHistoryDepth: 30,
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
          contextLimit: 4096,
          ltmContextBudget: 800,
          embeddingContextBudget: 500,
          chatHistoryDepth: 20,
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
          contextLimit: 6144,
          ltmContextBudget: 1000,
          embeddingContextBudget: 1000,
          chatHistoryDepth: 24,
        });
        break;
      case 'precise':
        setForm({
          ...form,
          temperature: 0.40,
          responseLength: 'short',
          maxTokens: 800,
          topP: 0.70,
          topA: 0.30,
          topK: 20,
          repetitionPenalty: 1.00,
          contextLimit: 3072,
          ltmContextBudget: 400,
          embeddingContextBudget: 300,
          chatHistoryDepth: 14,
        });
        break;
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
      {/* Header Banner */}
      <div className={`rounded-2xl p-6 border transition-colors ${
        isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Pengaturan & Parameter AI
            </h1>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Konfigurasi kunci API, model default, 7 parameter respon cerita, dan pencadangan data.
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
            onClick={() => setActiveTab('models')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              activeTab === 'models'
                ? isDark ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold' : 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                : isDark ? 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200' : 'bg-transparent text-zinc-600 border-transparent hover:text-zinc-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Parameter AI (7 Kontrol)</span>
          </button>

          <button
            onClick={() => setActiveTab('keys')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              activeTab === 'keys'
                ? isDark ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold' : 'bg-zinc-900 text-white border-zinc-900 font-semibold'
                : isDark ? 'bg-transparent text-zinc-400 border-transparent hover:text-zinc-200' : 'bg-transparent text-zinc-600 border-transparent hover:text-zinc-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys & Provider</span>
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

        {/* Tab 1: 7 AI Parameters & Models */}
        {activeTab === 'models' && (
          <div className="space-y-6">
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

            {/* Quick Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold">Preset Parameter Cepat</label>
                <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Klik untuk atur ke-7 parameter sekaligus</span>
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
                  <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Variatif & plot tak terduga</p>
                </button>
                <button
                  type="button"
                  onClick={() => applyParameterPreset('rpg')}
                  className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    isDark ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <p className="font-semibold text-xs">RPG Master</p>
                  <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Logis, terarah & seimbang</p>
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
                  <span className="font-semibold">2. Target Panjang Respon (Panduan Gaya Cerita):</span>
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
                  Batas keras jumlah token balasan yang boleh dihasilkan AI dalam satu kali kirim.
                </p>
              </div>

              {/* 4. Top-P */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1">
                    4. Top-P / Nucleus Sampling:
                    <span className="font-mono text-zinc-400 font-normal">{form.topP}</span>
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {Math.round(form.topP * 100)}% kandidat teratas
                  </span>
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
                <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Memilih kata dari kelompok teratas dengan total akumulasi probabilitas P, membuang kata aneh di bagian bawah.
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
                  Memangkas kata lain jika AI sangat yakin pada kata teratas, mencegah karakter berbicara ngelantur.
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
                    {form.topK === 0 ? 'Semua kata' : `${form.topK} kata teratas`}
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
                  Membatasi pilihan hanya ke sejumlah K kata dengan probabilitas tertinggi sebelum sampling.
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
                  max="1.5"
                  step="0.02"
                  value={form.repetitionPenalty ?? 1.1}
                  onChange={(e) => setForm({ ...form, repetitionPenalty: parseFloat(e.target.value) })}
                  className="w-full cursor-pointer accent-zinc-500"
                />
                <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Mencegah AI mengulang-ulang frasa klise atau pola kalimat yang sama di setiap balasan.
                </p>
              </div>
            </div>

            {/* 4 Memory & Context Window Parameters Section */}
            <div className={`p-4 rounded-xl border space-y-4 ${
              isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Manajemen Memori & Jendela Konteks (4 Parameter)
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-600'
                }`}>
                  Token Budgeting
                </span>
              </div>

              {/* 1. Context Limit */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1">
                    1. Context Limit (Batas Total Konteks):
                    <span className="font-mono text-zinc-400 font-normal">{form.contextLimit ?? 4096} Token</span>
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {(form.contextLimit ?? 4096) >= 16384 ? 'Sangat Besar' : (form.contextLimit ?? 4096) >= 8192 ? 'Besar' : 'Standar'}
                  </span>
                </div>
                <input
                  type="range"
                  min="2048"
                  max="32768"
                  step="512"
                  value={form.contextLimit ?? 4096}
                  onChange={(e) => setForm({ ...form, contextLimit: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-zinc-500"
                />
                <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Batas total token gabungan (System Prompt + Memori + Riwayat Chat + Jawaban AI).
                </p>
              </div>

              {/* 2. LTM Context Budget */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1">
                    2. LTM Context Budget (Kuota Memori Peristiwa):
                    <span className="font-mono text-zinc-400 font-normal">{form.ltmContextBudget ?? 800} Token</span>
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    ~{Math.round((form.ltmContextBudget ?? 800) / 40)} butir memori
                  </span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="3000"
                  step="50"
                  value={form.ltmContextBudget ?? 800}
                  onChange={(e) => setForm({ ...form, ltmContextBudget: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-zinc-500"
                />
                <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Alokasi token khusus untuk memori peristiwa penting, janji, rahasia, dan relasi.
                </p>
              </div>

              {/* 3. Embedding Context Budget */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1">
                    3. Embedding Context Budget (Kuota World Lore / RAG):
                    <span className="font-mono text-zinc-400 font-normal">{form.embeddingContextBudget ?? 500} Token</span>
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    ~{Math.round((form.embeddingContextBudget ?? 500) / 60)} entri lore
                  </span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={form.embeddingContextBudget ?? 500}
                  onChange={(e) => setForm({ ...form, embeddingContextBudget: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-zinc-500"
                />
                <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Alokasi token untuk entri lorebook / ensiklopedia dunia yang cocok dengan topik.
                </p>
              </div>

              {/* 4. Chat History Depth */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1">
                    4. Chat History Depth (Kedalaman Riwayat Chat):
                    <span className="font-mono text-zinc-400 font-normal">{form.chatHistoryDepth ?? 20} Pesan</span>
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {form.chatHistoryDepth ?? 20} putaran terakhir
                  </span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="60"
                  step="2"
                  value={form.chatHistoryDepth ?? 20}
                  onChange={(e) => setForm({ ...form, chatHistoryDepth: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-zinc-500"
                />
                <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Jumlah pesan terbaru yang langsung dikirimkan ke AI sebagai riwayat aktif.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: API Keys */}
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

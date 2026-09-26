'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { db } from '@/lib/db';
import { ApiSettings, ProviderType, AppBackupData } from '@/types';
import {
  X,
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
} from 'lucide-react';
import { POPULAR_MODELS } from '@/lib/providers/types';
import { downloadJson, readJsonFile } from '@/lib/utils';
import { PRESET_CHARACTERS, PRESET_PERSONAS } from '@/lib/presets';

export function SettingsModal() {
  const { isSettingsOpen, setIsSettingsOpen, settings, updateSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState<'keys' | 'models' | 'tts' | 'data'>('keys');

  // Form local states
  const [form, setForm] = useState<ApiSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

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
    if (confirm('Kembalikan semua karakter dan persona bawaan ke awal? (Riwayat chat kustom tetap aman)')) {
      await db.characters.bulkPut(PRESET_CHARACTERS);
      await db.personas.bulkPut(PRESET_PERSONAS);
      alert('Data preset berhasil diperbarui!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] glass-panel rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-white/10">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pengaturan API & Engine AI</h2>
              <p className="text-xs text-zinc-400">Konfigurasi API Keys, Model Utama, Suara TTS, dan Backup</p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/5 overflow-x-auto">
          {[
            { id: 'keys', label: '1. API Keys', icon: Key },
            { id: 'models', label: '2. Model & Parameter', icon: Sliders },
            { id: 'tts', label: '3. Suara (TTS)', icon: Volume2 },
            { id: 'data', label: '4. Backup & Reset', icon: Database },
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

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'keys' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  Keamanan API Key:
                </p>
                <p className="text-zinc-300">
                  API Key disimpan secara aman di browser lokal Anda (IndexedDB/LocalStorage) dan langsung memanggil endpoint resmi tanpa perantara server pihak ketiga.
                </p>
              </div>

              {/* Gemini Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    Google Gemini API Key (Rekomendasi - Cepat & Kuota Luas)
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    Dapatkan Key Gratis <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={form.geminiApiKey}
                  onChange={(e) => setForm({ ...form, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono"
                />
              </div>

              {/* OpenRouter Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    OpenRouter API Key (Akses Claude, DeepSeek R1, Llama 3, Mythomax)
                  </label>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-purple-400 hover:underline flex items-center gap-1"
                  >
                    Daftar OpenRouter <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={form.openRouterApiKey}
                  onChange={(e) => setForm({ ...form, openRouterApiKey: e.target.value })}
                  placeholder="sk-or-v1-..."
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono"
                />
              </div>

              {/* Groq Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Groq API Key (Streaming Instan LPU)
                  </label>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    Dapatkan Groq Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={form.groqApiKey}
                  onChange={(e) => setForm({ ...form, groqApiKey: e.target.value })}
                  placeholder="gsk_..."
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono"
                />
              </div>

              {/* OpenAI Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    OpenAI API Key (GPT-4o, GPT-4o Mini)
                  </label>
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    OpenAI Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="password"
                  value={form.openaiApiKey}
                  onChange={(e) => setForm({ ...form, openaiApiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono"
                />
              </div>

              {/* Custom / Ollama Endpoint */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    Custom Endpoint / Ollama Local AI
                  </label>
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
                      className="px-2 py-0.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] cursor-pointer"
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
                      className="px-2 py-0.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] cursor-pointer"
                    >
                      Set LM Studio
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-0.5">
                  <p className="font-semibold">⚠️ Catatan Ollama:</p>
                  <p className="text-zinc-300">
                    Gunakan Base URL: <code className="text-amber-200">http://localhost:11434/v1</code> (jangan <code className="line-through text-rose-300">https://ollama.com</code>). Pastikan aplikasi Ollama aktif di PC.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Base URL</label>
                    <input
                      type="text"
                      value={form.customBaseUrl}
                      onChange={(e) => setForm({ ...form, customBaseUrl: e.target.value })}
                      placeholder="http://localhost:11434/v1"
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Model Name</label>
                    <input
                      type="text"
                      value={form.customModelName}
                      onChange={(e) => setForm({ ...form, customModelName: e.target.value })}
                      placeholder="gemma2:27b, llama3.2, dll."
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Provider Default</label>
                  <select
                    value={form.defaultProvider}
                    onChange={(e) => setForm({ ...form, defaultProvider: e.target.value as ProviderType })}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm bg-zinc-900 cursor-pointer"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openrouter">OpenRouter (Multi-Model)</option>
                    <option value="groq">Groq LPU</option>
                    <option value="openai">OpenAI</option>
                    <option value="custom">Custom / Ollama Local</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Model ID Default</label>
                  <input
                    type="text"
                    value={form.defaultModel}
                    onChange={(e) => setForm({ ...form, defaultModel: e.target.value })}
                    placeholder="gemini-3.8-flash"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm font-mono"
                  />
                </div>
              </div>

              {/* Preset Model Picker */}
              <div>
                <p className="text-xs font-semibold text-zinc-300 mb-2">Pilih Cepat dari Model Populer:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POPULAR_MODELS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setForm({ ...form, defaultProvider: m.provider, defaultModel: m.id })}
                      className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        form.defaultProvider === m.provider && form.defaultModel === m.id
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200'
                          : 'bg-zinc-900/60 border-white/5 hover:border-white/20 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{m.name}</span>
                        {m.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-cyan-300">
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{m.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1">
                    <span>Temperature: {form.temperature}</span>
                    <span className="text-zinc-400">{form.temperature > 0.8 ? 'Kreatif' : 'Terfokus'}</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={1.5}
                    step={0.05}
                    value={form.temperature}
                    onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-1">
                    <span>Max Tokens: {form.maxTokens}</span>
                    <span className="text-zinc-400">~{Math.round(form.maxTokens * 0.75)} kata</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={4000}
                    step={100}
                    value={form.maxTokens}
                    onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/60 border border-white/10">
                <div>
                  <h4 className="text-sm font-bold text-white">Aktifkan Text-to-Speech (Suara Karakter)</h4>
                  <p className="text-xs text-zinc-400">Membacakan respon AI secara otomatis menggunakan Web Speech API</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.enableTTS}
                  onChange={(e) => setForm({ ...form, enableTTS: e.target.checked })}
                  className="w-5 h-5 accent-cyan-400 cursor-pointer"
                />
              </div>

              {form.enableTTS && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Pilih Suara (Voice)</label>
                    <select
                      value={form.ttsVoice}
                      onChange={(e) => setForm({ ...form, ttsVoice: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl glass-input text-xs bg-zinc-900 cursor-pointer"
                    >
                      <option value="">Default Browser Voice</option>
                      {availableVoices.map((v, i) => (
                        <option key={i} value={v.name}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-zinc-300 mb-1">Kecepatan Bicara ({form.ttsRate}x)</label>
                      <input
                        type="range"
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        value={form.ttsRate}
                        onChange={(e) => setForm({ ...form, ttsRate: parseFloat(e.target.value) })}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-300 mb-1">Pitch Suara ({form.ttsPitch})</label>
                      <input
                        type="range"
                        min={0.5}
                        max={1.5}
                        step={0.1}
                        value={form.ttsPitch}
                        onChange={(e) => setForm({ ...form, ttsPitch: parseFloat(e.target.value) })}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-white">Ekspor & Impor Data (Backup Lengkap)</h4>
                <p className="text-xs text-zinc-400">
                  Simpan semua karakter kustom, persona pemain, riwayat chat, dan pengaturan ke file JSON lokal.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleExportAllBackup}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/30 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Backup JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => backupFileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 text-xs font-semibold cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span>Pulihkan dari File Backup</span>
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

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                <h4 className="text-sm font-bold text-rose-300">Kembalikan Karakter Preset Bawaan</h4>
                <p className="text-xs text-zinc-400">
                  Jika ada karakter bawaan yang terhapus secara tidak sengaja, klik tombol di bawah untuk memulihkan preset awal.
                </p>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold hover:bg-rose-500/30 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Pulihkan Karakter Preset</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-white/10 flex items-center justify-between bg-zinc-950/80">
          <div>
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-in fade-in">
                <CheckCircle className="w-4 h-4" />
                Pengaturan berhasil disimpan!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

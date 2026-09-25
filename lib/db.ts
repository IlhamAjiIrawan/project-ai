import Dexie, { Table } from 'dexie';
import { Character, ChatMessage, ChatSession, UserPersona, ApiSettings } from '@/types';
import { PRESET_CHARACTERS, PRESET_PERSONAS } from './presets';

export const DEFAULT_SETTINGS: ApiSettings = {
  geminiApiKey: '',
  openRouterApiKey: '',
  groqApiKey: '',
  openaiApiKey: '',
  customBaseUrl: '',
  customApiKey: '',
  customModelName: '',
  
  defaultProvider: 'gemini',
  defaultModel: 'gemini-3.8-flash',
  
  temperature: 0.8,
  maxTokens: 1000,
  topP: 0.95,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  
  streamResponse: true,
  enableTTS: false,
  ttsVoice: '',
  ttsRate: 1.0,
  ttsPitch: 1.0,
};

export class RoleplayDatabase extends Dexie {
  characters!: Table<Character, string>;
  chatSessions!: Table<ChatSession, string>;
  chatMessages!: Table<ChatMessage, string>;
  personas!: Table<UserPersona, string>;
  settings!: Table<ApiSettings & { id: string }, string>;

  constructor() {
    super('RoleplayAIEngineDB');
    this.version(1).stores({
      characters: 'id, name, category, isCustom, createdAt, updatedAt',
      chatSessions: 'id, characterId, personaId, updatedAt, createdAt',
      chatMessages: 'id, sessionId, role, timestamp',
      personas: 'id, name, isDefault, createdAt',
      settings: 'id',
    });
  }
}

export const db = new RoleplayDatabase();

let isSeedingPromise: Promise<void> | null = null;

// Seed initial database if empty (idempotent with bulkPut & promise lock)
export async function seedDatabaseIfEmpty() {
  if (isSeedingPromise) {
    return isSeedingPromise;
  }

  isSeedingPromise = (async () => {
    try {
      const charCount = await db.characters.count();
      if (charCount === 0) {
        await db.characters.bulkPut(PRESET_CHARACTERS);
      }

      const personaCount = await db.personas.count();
      if (personaCount === 0) {
        await db.personas.bulkPut(PRESET_PERSONAS);
      }

      const settingsCount = await db.settings.count();
      if (settingsCount === 0) {
        // Check if localStorage has stored API keys from previous session
        let existingKeys: Partial<ApiSettings> = {};
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('roleplay_api_settings');
            if (stored) existingKeys = JSON.parse(stored);
          } catch {}
        }
        await db.settings.put({
          id: 'global',
          ...DEFAULT_SETTINGS,
          ...existingKeys,
        });
      } else {
        // Auto-upgrade legacy deprecated model names if stored
        const currentStored = await db.settings.get('global');
        if (currentStored && currentStored.defaultModel === 'gemini-2.5-flash') {
          await db.settings.update('global', { defaultModel: 'gemini-3.8-flash' });
        }
      }
    } catch (err) {
      console.error('Error seeding database:', err);
    } finally {
      isSeedingPromise = null;
    }
  })();

  return isSeedingPromise;
}

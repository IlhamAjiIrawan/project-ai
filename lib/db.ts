import Dexie, { Table } from 'dexie';
import { Character, ChatMessage, ChatSession, UserPersona, ApiSettings, SessionMemory } from '@/types';
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
  
  // 7 AI Generation & Sampling Parameters
  temperature: 0.8,
  responseLength: 'medium',
  maxTokens: 1000,
  topP: 0.95,
  topA: 0.0,
  topK: 40,
  repetitionPenalty: 1.1,

  // 4 Memory & Context Window Parameters
  contextLimit: 4096,
  ltmContextBudget: 800,
  embeddingContextBudget: 500,
  chatHistoryDepth: 20,

  // Auto Memory Consolidation
  autoMemoryEnabled: true,
  autoMemoryInterval: 10,
  
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
  sessionMemories!: Table<SessionMemory, string>;

  constructor() {
    super('RoleplayAIEngineDB');

    // Version 1 (Initial baseline)
    this.version(1).stores({
      characters: 'id, name, category, isCustom, createdAt, updatedAt',
      chatSessions: 'id, characterId, personaId, updatedAt, createdAt',
      chatMessages: 'id, sessionId, role, timestamp',
      personas: 'id, name, isDefault, createdAt',
      settings: 'id',
    });

    // Version 2 (Optimized compound index [sessionId+timestamp] & schema migration)
    this.version(2)
      .stores({
        characters: 'id, name, category, isCustom, createdAt, updatedAt',
        chatSessions: 'id, characterId, personaId, updatedAt, createdAt',
        chatMessages: 'id, sessionId, role, timestamp, [sessionId+timestamp]',
        personas: 'id, name, isDefault, createdAt',
        settings: 'id',
      })
      .upgrade(async (tx) => {
        // Ensure legacy records have valid default shapes
        await tx.table('characters').toCollection().modify((char) => {
          if (!char.tags) char.tags = [];
          if (char.isCustom === undefined) char.isCustom = false;
        });
      });

    // Version 3 (Dynamic Session Event Memories & Knowledge Journal)
    this.version(3).stores({
      characters: 'id, name, category, isCustom, createdAt, updatedAt',
      chatSessions: 'id, characterId, personaId, updatedAt, createdAt',
      chatMessages: 'id, sessionId, role, timestamp, [sessionId+timestamp]',
      personas: 'id, name, isDefault, createdAt',
      settings: 'id',
      sessionMemories: 'id, sessionId, characterId, category, enabled, timestamp',
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
      } else {
        // Sync any new presets that don't exist yet
        for (const preset of PRESET_CHARACTERS) {
          const exists = await db.characters.get(preset.id);
          if (!exists) {
            await db.characters.put(preset);
          }
        }
      }

      const personaCount = await db.personas.count();
      if (personaCount === 0) {
        await db.personas.bulkPut(PRESET_PERSONAS);
      } else {
        // Sync any new personas that don't exist yet
        for (const preset of PRESET_PERSONAS) {
          const exists = await db.personas.get(preset.id);
          if (!exists) {
            await db.personas.put(preset);
          }
        }
      }

      const settingsCount = await db.settings.count();
      if (settingsCount === 0) {
        // Check if localStorage has legacy stored API keys from previous session
        let existingKeys: Partial<ApiSettings> = {};
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('roleplay_api_settings');
            if (stored) {
              existingKeys = JSON.parse(stored);
              // Immediately remove legacy plaintext API keys from localStorage for security
              localStorage.removeItem('roleplay_api_settings');
            }
          } catch {}
        }
        await db.settings.put({
          id: 'global',
          ...DEFAULT_SETTINGS,
          ...existingKeys,
        });
      } else {
        // Clean up legacy localStorage if it still exists
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('roleplay_api_settings');
          } catch {}
        }
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

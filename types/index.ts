export type ProviderType = 'gemini' | 'openrouter' | 'groq' | 'openai' | 'custom';

export type ResponseLengthType = 'short' | 'medium' | 'long' | 'unlimited';

export interface ModelOption {
  id: string;
  name: string;
  provider: ProviderType;
  description?: string;
  contextWindow?: number;
  recommended?: boolean;
}

export interface LoreEntry {
  id: string;
  keys: string[]; // Keywords that trigger this memory
  content: string; // Background information to inject
  enabled: boolean;
}

export interface Character {
  id: string;
  name: string;
  avatar: string;
  tagline: string;
  description: string;
  systemPrompt: string;
  greetingMessage: string;
  scenario: string;
  exampleDialogue: string;
  tags: string[];
  category: 'fantasy' | 'scifi' | 'anime' | 'mystery' | 'romance' | 'rpg' | 'assistant' | 'custom';
  lorebook?: LoreEntry[];
  customProvider?: ProviderType;
  customModel?: string;
  
  // Generation Parameters Override
  temperature?: number;
  responseLength?: ResponseLengthType;
  maxTokens?: number;
  topP?: number;
  topA?: number;
  topK?: number;
  repetitionPenalty?: number;

  // Memory & Context Budget Overrides
  contextLimit?: number;
  ltmContextBudget?: number;
  embeddingContextBudget?: number;
  chatHistoryDepth?: number;

  isCustom?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface UserPersona {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  isDefault: boolean;
  createdAt: number;
}

export interface MessageSwipe {
  content: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  swipes?: string[]; // Array of generated alternative replies
  currentSwipeIndex?: number;
  timestamp: number;
  modelUsed?: string;
  providerUsed?: ProviderType;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  characterId: string;
  personaId?: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  lastMessagePreview?: string;
  affinityLevel?: number; // 1 to 100 (default 1)
  affinityExp?: number;   // 0 to 100 progress to next level
  relationshipTitle?: string;
}

export interface ApiSettings {
  geminiApiKey: string;
  openRouterApiKey: string;
  groqApiKey: string;
  openaiApiKey: string;
  customBaseUrl: string;
  customApiKey: string;
  customModelName: string;
  
  defaultProvider: ProviderType;
  defaultModel: string;
  
  // 7 AI Generation & Sampling Parameters
  temperature: number;
  responseLength: ResponseLengthType;
  maxTokens: number;
  topP: number;
  topA: number;
  topK: number;
  repetitionPenalty: number;

  // 4 Memory & Context Window Parameters
  contextLimit: number;
  ltmContextBudget: number;
  embeddingContextBudget: number;
  chatHistoryDepth: number;
  
  // Legacy / fallback fields
  frequencyPenalty?: number;
  presencePenalty?: number;
  
  streamResponse: boolean;
  enableTTS: boolean;
  ttsVoice: string;
  ttsRate: number;
  ttsPitch: number;
}

export type MemoryCategory = 'event' | 'relation' | 'fact' | 'promise' | 'secret';

export interface SessionMemory {
  id: string;
  sessionId: string;
  characterId: string;
  content: string; // The remembered event, fact, or promise
  category: MemoryCategory;
  importance?: 'high' | 'medium' | 'low';
  source?: 'manual' | 'auto';
  enabled: boolean;
  timestamp: number;
}

export interface MemoryExtractionResult {
  add: Array<{
    category: MemoryCategory;
    content: string;
    importance?: 'high' | 'medium' | 'low';
  }>;
  update: Array<{
    id: string;
    category?: MemoryCategory;
    content: string;
    importance?: 'high' | 'medium' | 'low';
  }>;
  remove: Array<{
    id: string;
    reason?: string;
  }>;
}

export interface AppBackupData {
  version: number;
  exportedAt: string;
  characters?: Character[];
  sessions?: ChatSession[];
  messages?: ChatMessage[];
  personas?: UserPersona[];
  settings?: ApiSettings;
  memories?: SessionMemory[];
}

export type ActiveView = 'chat' | 'gallery' | 'character_editor' | 'persona_editor';


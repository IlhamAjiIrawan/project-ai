export type ProviderType = 'gemini' | 'openrouter' | 'groq' | 'openai' | 'custom';

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
  temperature?: number;
  maxTokens?: number;
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
  
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  
  streamResponse: boolean;
  enableTTS: boolean;
  ttsVoice: string;
  ttsRate: number;
  ttsPitch: number;
}

export type ActiveView = 'chat' | 'gallery' | 'character_editor' | 'persona_editor';

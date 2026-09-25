import { ApiSettings, ChatMessage, ProviderType } from '@/types';

export interface ProviderRequestOptions {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  settings: ApiSettings;
  model: string;
  onChunk?: (chunkText: string) => void;
  signal?: AbortSignal;
}

export interface ModelPresetItem {
  id: string;
  name: string;
  provider: ProviderType;
  description: string;
  badge?: string;
  recommended?: boolean;
}

export const POPULAR_MODELS: ModelPresetItem[] = [
  // Gemini
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    description: 'Sangat cepat, cerdas, efisien & ideal untuk roleplay real-time',
    badge: 'Cepat & Cerdas',
    recommended: true,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    description: 'Kreativitas tinggi, pemahaman konteks sangat panjang & mendalam',
    badge: 'Kreatif / Deep RPG',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    description: 'Model ringan dan responsif untuk percakapan santai',
  },

  // OpenRouter
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1 (OpenRouter)',
    provider: 'openrouter',
    description: 'Model reasoning state-of-the-art dengan plot kompleks',
    badge: 'Reasoning Monster',
    recommended: true,
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3 (OpenRouter)',
    provider: 'openrouter',
    description: 'Model conversational serba bisa dengan respon natural',
    badge: 'Populer',
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (OpenRouter)',
    provider: 'openrouter',
    description: 'Standar emas penulisan cerita roleplay & dialog imersif',
    badge: 'Penulisan Terbaik',
    recommended: true,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B (OpenRouter)',
    provider: 'openrouter',
    description: 'Model open-source terkuat untuk karakter fiksi & skenario',
  },
  {
    id: 'gryphe/mythomax-l2-13b',
    name: 'MythoMax 13B (OpenRouter)',
    provider: 'openrouter',
    description: 'Model legendaris yang dirancang khusus untuk roleplaying cerita fiksi',
    badge: 'Spesialis Roleplay',
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash (Free via OpenRouter)',
    provider: 'openrouter',
    description: 'Akses gratis via OpenRouter dengan kuota komunitas',
    badge: 'Free Tier',
  },

  // Groq
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B (Groq)',
    provider: 'groq',
    description: 'Kecepatan streaming ultra instan dengan LPU Groq',
    badge: 'Ultra Fast',
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'DeepSeek R1 Distill 70B (Groq)',
    provider: 'groq',
    description: 'DeepSeek R1 dengan latensi super rendah di Groq',
  },

  // OpenAI
  {
    id: 'gpt-4o',
    name: 'GPT-4o (OpenAI)',
    provider: 'openai',
    description: 'Model flagship OpenAI dengan pemahaman nuansa tinggi',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (OpenAI)',
    provider: 'openai',
    description: 'Cepat, hemat token, dan akurat untuk percakapan',
  },
];

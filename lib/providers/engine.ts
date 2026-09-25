import { Character, ChatMessage, UserPersona, ApiSettings, ProviderType } from '@/types';
import { callGeminiStream } from './gemini';
import { callOpenRouterStream } from './openrouter';
import { callOpenAICompatibleStream } from './openai';

export interface GenerateRoleplayOptions {
  character: Character;
  userPersona?: UserPersona;
  chatHistory: ChatMessage[];
  newUserMessage: string;
  settings: ApiSettings;
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
}

export function constructRoleplaySystemPrompt(
  character: Character,
  userPersona?: UserPersona,
  recentChatText: string = ''
): string {
  const userName = userPersona?.name || 'User';
  const userBio = userPersona?.bio ? `[Profil Pemain/User: ${userPersona.name} - ${userPersona.bio}]` : '';

  // Scan Lorebook if present
  let activeLore = '';
  if (character.lorebook && character.lorebook.length > 0) {
    const combinedText = (recentChatText + ' ' + character.scenario).toLowerCase();
    const triggeredEntries = character.lorebook.filter((entry) => {
      if (!entry.enabled) return false;
      return entry.keys.some((k) => combinedText.includes(k.toLowerCase().trim()));
    });

    if (triggeredEntries.length > 0) {
      activeLore = `\n[Memori / World Lore Tambahan Terkait:\n${triggeredEntries.map((e) => `- ${e.content}`).join('\n')}\n]`;
    }
  }

  // Replace {{char}} and {{user}} placeholders
  let baseSystemPrompt = character.systemPrompt || '';
  baseSystemPrompt = baseSystemPrompt
    .replace(/\{\{char\}\}/gi, character.name)
    .replace(/\{\{user\}\}/gi, userName);

  let scenarioText = character.scenario || '';
  if (scenarioText) {
    scenarioText = `[Skenario & Latar Tempat: ${scenarioText.replace(/\{\{char\}\}/gi, character.name).replace(/\{\{user\}\}/gi, userName)}]`;
  }

  let exampleDialogueText = character.exampleDialogue || '';
  if (exampleDialogueText) {
    exampleDialogueText = `[Contoh Gaya Bahasa & Dialog:\n${exampleDialogueText.replace(/\{\{char\}\}/gi, character.name).replace(/\{\{user\}\}/gi, userName)}\n]`;
  }

  return `[PERAN UTAMA & INSTRUKSI ROLEPLAY]
Kamu adalah ${character.name}.
Deskripsi Karakter: ${character.description || character.tagline}

${baseSystemPrompt}

${userBio}

${scenarioText}

${activeLore}

${exampleDialogueText}

[ATURAN PENULISAN FORMAT ROLEPLAY]
1. Selalu pertahankan identitas dan watak ${character.name}.
2. Tuliskan tindakan, bahasa tubuh, ekspresi, dan narasi atmosferik di dalam tanda bintang: *contoh tindakan atau desahan nafas*.
3. Tuliskan kata-kata yang diucapkan langsung dalam tanda kutip: "contoh ucapan".
4. Tanggapi dengan gaya penulisan novel interaktif yang hidup, dinamis, dan tidak kaku.
5. Jangan pernah memotong peran menjadi asisten AI generik. Lanjutkan alur cerita dengan imersif.`.trim();
}

export async function generateRoleplayResponse(options: GenerateRoleplayOptions): Promise<string> {
  const { character, userPersona, chatHistory, newUserMessage, settings, onChunk, signal } = options;

  // Determine provider & model
  const provider: ProviderType = character.customProvider || settings.defaultProvider || 'gemini';
  const model: string = character.customModel || settings.defaultModel || (provider === 'gemini' ? 'gemini-2.5-flash' : 'deepseek/deepseek-chat');

  // Build recent context text for lorebook keyword matching
  const recentMessages = chatHistory.slice(-6);
  const recentText = recentMessages.map((m) => m.content).join(' ') + ' ' + newUserMessage;

  // Construct System Prompt
  const systemPrompt = constructRoleplaySystemPrompt(character, userPersona, recentText);

  // Format message history (sliding window up to last 20 messages for deep context)
  const historyForLLM = chatHistory.slice(-20).map((msg) => ({
    role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
    content: msg.content,
  }));

  // Append current user message if provided
  if (newUserMessage) {
    historyForLLM.push({
      role: 'user',
      content: newUserMessage,
    });
  }

  const temperature = character.temperature ?? settings.temperature ?? 0.8;
  const maxTokens = character.maxTokens ?? settings.maxTokens ?? 1000;
  const topP = settings.topP ?? 0.95;

  const requestOptions = {
    systemPrompt,
    messages: historyForLLM,
    temperature,
    maxTokens,
    topP,
    settings,
    model,
    onChunk,
    signal,
  };

  switch (provider) {
    case 'gemini':
      return await callGeminiStream(requestOptions);
    case 'openrouter':
      return await callOpenRouterStream(requestOptions);
    case 'groq':
      return await callOpenAICompatibleStream(requestOptions, 'groq');
    case 'openai':
      return await callOpenAICompatibleStream(requestOptions, 'openai');
    case 'custom':
      return await callOpenAICompatibleStream(requestOptions, 'custom');
    default:
      return await callGeminiStream(requestOptions);
  }
}

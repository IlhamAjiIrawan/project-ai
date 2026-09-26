import { Character, ChatMessage, UserPersona, ApiSettings, ProviderType, SessionMemory, MemoryCategory } from '@/types';
import { decryptSensitiveText } from '@/lib/crypto';
import { getRelationshipTier } from '@/lib/relationship';

export interface GenerateRoleplayOptions {
  character: Character;
  userPersona?: UserPersona;
  chatHistory: ChatMessage[];
  newUserMessage: string;
  settings: ApiSettings;
  memories?: SessionMemory[];
  affinityLevel?: number;
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
}

/**
 * Approximate token estimation heuristic (~4 chars per token for multilingual text).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Builds smart context window from chat history within a specified token budget.
 * - Always preserves the initial anchor message (greeting/scenario setup) if available.
 * - Fills the remainder of the token budget with the most recent messages.
 */
export function buildOptimizedHistory(
  chatHistory: ChatMessage[],
  maxHistoryTokens: number = 6000
): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (chatHistory.length === 0) return [];

  const formattedAll = chatHistory.map((msg) => ({
    role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
    content: msg.content,
  }));

  if (formattedAll.length <= 1) return formattedAll;

  // Preserve initial greeting / scenario intro message as permanent anchor
  const firstMsg = formattedAll[0];
  const firstMsgTokens = estimateTokens(firstMsg.content);

  let currentTokens = firstMsgTokens;
  const selectedRecent: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  // Iterate backwards from most recent message
  for (let i = formattedAll.length - 1; i >= 1; i--) {
    const msg = formattedAll[i];
    const tokens = estimateTokens(msg.content);
    if (currentTokens + tokens > maxHistoryTokens) {
      break;
    }
    currentTokens += tokens;
    selectedRecent.unshift(msg);
  }

  // Ensure first message is retained at beginning
  if (selectedRecent.length === 0 || selectedRecent[0] !== firstMsg) {
    return [firstMsg, ...selectedRecent];
  }

  return selectedRecent;
}

export function constructRoleplaySystemPrompt(
  character: Character,
  userPersona?: UserPersona,
  recentChatText: string = '',
  responseLength: string = 'medium',
  memories: SessionMemory[] = [],
  affinityLevel: number = 1
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

  // Ingest dynamic session memories (episodic event memory)
  let activeMemories = '';
  if (memories && memories.length > 0) {
    const enabledMemories = memories.filter((m) => m.enabled !== false);
    if (enabledMemories.length > 0) {
      const memoryBullets = enabledMemories
        .map((m) => {
          const categoryTag =
            m.category === 'promise'
              ? 'Janji/Komitmen'
              : m.category === 'relation'
              ? 'Status Hubungan'
              : m.category === 'secret'
              ? 'Rahasia/Fakta Tersembunyi'
              : m.category === 'fact'
              ? 'Fakta Penting'
              : 'Peristiwa Terjadi';
          return `- [${categoryTag}] ${m.content.replace(/\{\{char\}\}/gi, character.name).replace(/\{\{user\}\}/gi, userName)}`;
        })
        .join('\n');

      activeMemories = `\n[MEMORI PERISTIWA PENTING DARI SESI INI (JANGAN PERNAH DILUPAKAN OLEH ${character.name.toUpperCase()})]:\n${memoryBullets}\n`;
    }
  }

  // Ingest Relationship / Affinity Tier directives
  const tierInfo = getRelationshipTier(affinityLevel);
  const relationshipBehavior = tierInfo.behaviorPrompt
    .replace(/\{\{char\}\}/gi, character.name)
    .replace(/\{\{user\}\}/gi, userName);

  const relationshipBlock = `\n[STATUS TINGKATAN HUBUNGAN SAAT INI (LEVEL ${affinityLevel}/100: ${tierInfo.title.toUpperCase()} ${tierInfo.emoji})]
Status Hubungan: ${tierInfo.title} (${tierInfo.subTitle})
Panduan Sikap & Perlakuan terhadap ${userName}:
${relationshipBehavior}\n`;

  // Length guide
  let lengthInstruction = 'Gaya Panjang Respon: Sedang (2-3 paragraf naratif seimbang antara aksi dan dialog).';
  if (responseLength === 'short') {
    lengthInstruction = 'Gaya Panjang Respon: Singkat (1-2 paragraf padat). Utamakan dialog cepat dan aksi langsung.';
  } else if (responseLength === 'long') {
    lengthInstruction = 'Gaya Panjang Respon: Panjang & Deskriptif (4+ paragraf gaya novel). Berikan detail atmosferik, monolog batin, dan dinamika cerita yang mendalam.';
  } else if (responseLength === 'unlimited') {
    lengthInstruction = 'Gaya Panjang Respon: Bebas dan fleksibel sesuai kebutuhan perkembangan alur cerita.';
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

${relationshipBlock}

${activeLore}

${activeMemories}

${exampleDialogueText}

[ATURAN PENULISAN FORMAT ROLEPLAY]
1. Selalu pertahankan identitas dan watak ${character.name}.
2. ${lengthInstruction}
3. Tuliskan tindakan, bahasa tubuh, ekspresi, dan narasi atmosferik di dalam tanda bintang: *contoh tindakan atau desahan nafas*.
4. Tuliskan kata-kata yang diucapkan langsung dalam tanda kutip: "contoh ucapan".
5. Tanggapi dengan gaya penulisan novel interaktif yang hidup, dinamis, dan tidak kaku.
6. Jangan pernah memotong peran menjadi asisten AI generik. Lanjutkan alur cerita dengan imersif.`.trim();
}

/**
 * Fetch wrapper with exponential backoff retry for transient network / rate-limit failures (429, 502, 503)
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 2,
  baseDelayMs: number = 1000
): Promise<Response> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (options.signal?.aborted) {
      throw new Error('Permintaan dibatalkan oleh pengguna.');
    }

    try {
      const response = await fetch(url, options);

      // Retry on transient status (429 Too Many Requests, 502/503/504 Bad Gateway or Unavailable)
      if ((response.status === 429 || response.status >= 502) && attempt < maxRetries) {
        const retryAfterHeader = response.headers.get('Retry-After');
        const delay = retryAfterHeader
          ? parseInt(retryAfterHeader, 10) * 1000
          : baseDelayMs * Math.pow(2, attempt);

        await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 4000)));
        continue;
      }

      return response;
    } catch (err: unknown) {
      lastError = err;
      if (options.signal?.aborted) throw err;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs * Math.pow(2, attempt)));
        continue;
      }
    }
  }

  throw (lastError instanceof Error ? lastError : new Error('Gagal menghubungi server setelah beberapa percobaan.'));
}

export async function generateRoleplayResponse(options: GenerateRoleplayOptions): Promise<string> {
  const { character, userPersona, chatHistory, newUserMessage, settings, onChunk, signal } = options;

  // Determine provider & model
  const provider: ProviderType = character.customProvider || settings.defaultProvider || 'gemini';
  const model: string =
    character.customModel ||
    settings.defaultModel ||
    (provider === 'gemini' ? 'gemini-3.8-flash' : 'deepseek/deepseek-chat');

  // Build recent context text for lorebook keyword matching
  const recentMessages = chatHistory.slice(-6);
  const recentText = recentMessages.map((m) => m.content).join(' ') + ' ' + newUserMessage;

  // Resolve 7 parameters with character-level override fallback to global settings
  const temperature = character.temperature ?? settings.temperature ?? 0.8;
  const responseLength = character.responseLength ?? settings.responseLength ?? 'medium';
  const maxTokens = character.maxTokens ?? settings.maxTokens ?? 1000;
  const topP = character.topP ?? settings.topP ?? 0.95;
  const topA = character.topA ?? settings.topA ?? 0.0;
  const topK = character.topK ?? settings.topK ?? 40;
  const repetitionPenalty = character.repetitionPenalty ?? settings.repetitionPenalty ?? 1.1;

  // Construct System Prompt
  const systemPrompt = constructRoleplaySystemPrompt(
    character,
    userPersona,
    recentText,
    responseLength,
    options.memories || [],
    options.affinityLevel || 1
  );

  // Format message history with smart token-budget context window
  const historyForLLM = buildOptimizedHistory(chatHistory, 6000);

  // Append current user message if provided
  if (newUserMessage) {
    historyForLLM.push({
      role: 'user',
      content: newUserMessage,
    });
  }

  // Decrypt all API keys client-side before sending to the server.
  const decryptedSettings: ApiSettings = {
    ...settings,
    geminiApiKey: await decryptSensitiveText(settings.geminiApiKey || ''),
    openRouterApiKey: await decryptSensitiveText(settings.openRouterApiKey || ''),
    groqApiKey: await decryptSensitiveText(settings.groqApiKey || ''),
    openaiApiKey: await decryptSensitiveText(settings.openaiApiKey || ''),
    customApiKey: await decryptSensitiveText(settings.customApiKey || ''),
  };

  const payload = {
    provider,
    model,
    systemPrompt,
    messages: historyForLLM,
    temperature,
    responseLength,
    maxTokens,
    topP,
    topA,
    topK,
    repetitionPenalty,
    settings: decryptedSettings,
  };

  const response = await fetchWithRetry(
    '/api/chat',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    },
    2,
    1000
  );

  if (!response.ok) {
    let errorMsg = '';
    try {
      const errJson = await response.json();
      errorMsg = errJson.error || JSON.stringify(errJson);
    } catch {
      errorMsg = await response.text();
    }
    throw new Error(errorMsg || `HTTP Error ${response.status}`);
  }

  if (!response.body) {
    throw new Error('ReadableStream tidak didukung oleh respons server.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.substring(6);
      if (dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr);
        // Supports both OpenAI/OpenRouter delta format and Gemini candidate parts format
        let chunkText = '';
        if (parsed.choices && parsed.choices[0]?.delta?.content) {
          chunkText = parsed.choices[0].delta.content;
        } else if (parsed.candidates && parsed.candidates[0]?.content?.parts?.[0]?.text) {
          chunkText = parsed.candidates[0].content.parts[0].text;
        }

        if (chunkText) {
          fullText += chunkText;
          if (onChunk) {
            onChunk(chunkText);
          }
        }
      } catch {
        // Ignore JSON parse errors on partial chunks
      }
    }
  }

  return fullText;
}

/**
 * Automatically extracts key events, promises, relationship developments, and secrets
 * from recent conversation messages to store into episodic session memory.
 */
export async function extractMemoriesFromChat(options: {
  character: Character;
  userPersona?: UserPersona;
  chatHistory: ChatMessage[];
  settings: ApiSettings;
  signal?: AbortSignal;
}): Promise<Array<{ content: string; category: MemoryCategory }>> {
  const { character, userPersona, chatHistory, settings, signal } = options;
  if (chatHistory.length < 2) return [];

  const provider: ProviderType = character.customProvider || settings.defaultProvider || 'gemini';
  const model: string =
    character.customModel ||
    settings.defaultModel ||
    (provider === 'gemini' ? 'gemini-3.8-flash' : 'deepseek/deepseek-chat');

  const userName = userPersona?.name || 'User';

  const conversationSample = chatHistory
    .slice(-25)
    .map((m) => `${m.role === 'assistant' ? character.name : userName}: ${m.content}`)
    .join('\n\n');

  const extractionPrompt = `Kamu adalah sistem analisis memori roleplay AI.
Tugasmu: Analisis percakapan antara "${character.name}" dan "${userName}" di bawah ini.
Ekstrak 2 sampai 5 peristiwa penting, fakta baru, janji/kesepakatan, rahasia, atau perkembangan hubungan emosional yang terjadi dalam percakapan.

Format Output WAJIB JSON murni (array of objects) tanpa kata pengantar atau penutup apapun:
[
  {
    "content": "Ringkasan peristiwa atau fakta dalam 1-2 kalimat padat",
    "category": "event"
  }
]

Pilihan category yang valid: "event" | "relation" | "fact" | "promise" | "secret".

Percakapan yang dianalisis:
${conversationSample}`;

  const decryptedSettings: ApiSettings = {
    ...settings,
    geminiApiKey: await decryptSensitiveText(settings.geminiApiKey || ''),
    openRouterApiKey: await decryptSensitiveText(settings.openRouterApiKey || ''),
    groqApiKey: await decryptSensitiveText(settings.groqApiKey || ''),
    openaiApiKey: await decryptSensitiveText(settings.openaiApiKey || ''),
    customApiKey: await decryptSensitiveText(settings.customApiKey || ''),
  };

  const payload = {
    provider,
    model,
    systemPrompt: 'Kamu adalah asisten analisis memori yang selalu menghasilkan respon valid JSON.',
    messages: [{ role: 'user', content: extractionPrompt }],
    temperature: 0.3,
    maxTokens: 800,
    settings: decryptedSettings,
  };

  const res = await fetchWithRetry(
    '/api/chat',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    },
    1,
    1000
  );

  if (!res.ok) {
    throw new Error('Gagal menghubungi AI untuk mengekstrak memori.');
  }

  if (!res.body) {
    throw new Error('Tidak ada stream body dari server.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.substring(6);
      if (dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr);
        let chunkText = '';
        if (parsed.choices && parsed.choices[0]?.delta?.content) {
          chunkText = parsed.choices[0].delta.content;
        } else if (parsed.candidates && parsed.candidates[0]?.content?.parts?.[0]?.text) {
          chunkText = parsed.candidates[0].content.parts[0].text;
        }
        if (chunkText) fullText += chunkText;
      } catch {}
    }
  }

  const jsonMatch = fullText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => typeof item?.content === 'string' && item.content.trim().length > 0)
        .map((item) => ({
          content: item.content.trim(),
          category: (['event', 'relation', 'fact', 'promise', 'secret'].includes(item.category)
            ? item.category
            : 'event') as MemoryCategory,
        }));
    }
  } catch (e) {
    console.error('Error parsing extracted memories JSON:', e);
  }

  return [];
}

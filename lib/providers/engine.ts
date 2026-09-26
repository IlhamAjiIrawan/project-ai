import { Character, ChatMessage, UserPersona, ApiSettings, ProviderType } from '@/types';

export interface GenerateRoleplayOptions {
  character: Character;
  userPersona?: UserPersona;
  chatHistory: ChatMessage[];
  newUserMessage: string;
  settings: ApiSettings;
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

  // Construct System Prompt
  const systemPrompt = constructRoleplaySystemPrompt(character, userPersona, recentText);

  // Format message history with smart token-budget context window
  const historyForLLM = buildOptimizedHistory(chatHistory, 6000);

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

  const payload = {
    provider,
    model,
    systemPrompt,
    messages: historyForLLM,
    temperature,
    maxTokens,
    topP,
    settings,
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

import { Character, ChatMessage, UserPersona, ApiSettings, ProviderType, SessionMemory, MemoryCategory, MemoryExtractionResult } from '@/types';
import { decryptSensitiveText } from '@/lib/crypto';
import { getRelationshipTier, getRefusalGuide } from '@/lib/relationship';

export interface GenerateRoleplayOptions {
  character: Character;
  userPersona?: UserPersona;
  chatHistory: ChatMessage[];
  newUserMessage: string;
  settings: ApiSettings;
  memories?: SessionMemory[];
  affinityLevel?: number;
  authorsNote?: string;
  authorsNoteEnabled?: boolean;
  sceneState?: {
    location?: string;
    time?: string;
    notes?: string;
  };
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
 * Builds smart context window from chat history within a specified token budget and history depth.
 * - Always preserves the initial anchor message (greeting/scenario setup) if available.
 * - Fills the remainder of the token budget with the most recent messages up to maxDepth.
 */
export function buildOptimizedHistory(
  chatHistory: ChatMessage[],
  maxHistoryTokens: number = 6000,
  maxDepth: number = 20
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

  // Limit how far back to look based on maxDepth
  const startIndex = Math.max(1, formattedAll.length - depth(maxDepth));

  // Iterate backwards from most recent message
  for (let i = formattedAll.length - 1; i >= startIndex; i--) {
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

function depth(d: number) {
  return Math.max(1, d);
}

export function constructRoleplaySystemPrompt(
  character: Character,
  userPersona?: UserPersona,
  recentChatText: string = '',
  responseLength: string = 'medium',
  memories: SessionMemory[] = [],
  affinityLevel: number = 1,
  ltmContextBudget: number = 500,
  embeddingContextBudget: number = 250,
  authorsNote?: string,
  authorsNoteEnabled: boolean = false,
  sceneState?: {
    location?: string;
    time?: string;
    notes?: string;
  }
): string {
  const userName = userPersona?.name || 'User';
  const userBio = userPersona?.bio ? `[Profil Pemain/User: ${userPersona.name} - ${userPersona.bio}]` : '';

  // Scan Lorebook if present and enforce embeddingContextBudget
  let activeLore = '';
  if (character.lorebook && character.lorebook.length > 0) {
    const combinedText = (recentChatText + ' ' + character.scenario).toLowerCase();
    const triggeredEntries = character.lorebook.filter((entry) => {
      if (!entry.enabled) return false;
      return entry.keys.some((k) => combinedText.includes(k.toLowerCase().trim()));
    });

    if (triggeredEntries.length > 0) {
      let loreTokenSum = 0;
      const acceptedEntries: string[] = [];

      for (const entry of triggeredEntries) {
        const entryTokens = estimateTokens(entry.content);
        if (loreTokenSum + entryTokens <= embeddingContextBudget) {
          acceptedEntries.push(`- ${entry.content}`);
          loreTokenSum += entryTokens;
        }
      }

      if (acceptedEntries.length > 0) {
        activeLore = `\n[Memori / World Lore Tambahan Terkait:\n${acceptedEntries.join('\n')}\n]`;
      }
    }
  }

  // Ingest dynamic session memories (episodic event memory) and enforce ltmContextBudget
  let activeMemories = '';
  if (memories && memories.length > 0) {
    const enabledMemories = memories.filter((m) => m.enabled !== false);
    if (enabledMemories.length > 0) {
      // Sort: promise (always first, K10) → importance → category criticality → newest timestamp
      // Unfulfilled promises must never be trimmed before other memories in tight budgets.
      const categoryPriority: Record<string, number> = { promise: 1, secret: 2, relation: 3, fact: 4, event: 5 };
      const importancePriority: Record<string, number> = { high: 0, medium: 1, low: 2 };
      const sortedMemories = [...enabledMemories].sort((a, b) => {
        const promiseDiff = Number(b.category === 'promise') - Number(a.category === 'promise');
        if (promiseDiff !== 0) return promiseDiff;
        const impDiff = (importancePriority[a.importance ?? 'medium'] ?? 1) - (importancePriority[b.importance ?? 'medium'] ?? 1);
        if (impDiff !== 0) return impDiff;
        const catDiff = (categoryPriority[a.category ?? ''] ?? 5) - (categoryPriority[b.category ?? ''] ?? 5);
        if (catDiff !== 0) return catDiff;
        return (b.timestamp || 0) - (a.timestamp || 0);
      });

      let ltmTokenSum = 0;
      const acceptedMemories: string[] = [];

      for (const m of sortedMemories) {
        const categoryTag =
          m.category === 'promise'
            ? 'Janji/Komitmen'
            : m.category === 'relation'
            ? 'Momen Hubungan'
            : m.category === 'secret'
            ? 'Rahasia/Fakta Tersembunyi'
            : m.category === 'fact'
            ? 'Fakta Penting'
            : 'Peristiwa Terjadi';
        const formattedLine = `- [${categoryTag}] ${m.content.replace(/\{\{char\}\}/gi, character.name).replace(/\{\{user\}\}/gi, userName)}`;
        const lineTokens = estimateTokens(formattedLine);

        // Promises get 50% extra headroom beyond the LTM budget so they are never dropped
        // while lower-priority memories still fit inside the normal budget.
        const effectiveBudget = m.category === 'promise' ? Math.floor(ltmContextBudget * 1.5) : ltmContextBudget;
        if (ltmTokenSum + lineTokens <= effectiveBudget) {
          acceptedMemories.push(formattedLine);
          ltmTokenSum += lineTokens;
        }
      }

      if (acceptedMemories.length > 0) {
        activeMemories = `\n[MEMORI PERISTIWA PENTING DARI SESI INI (JANGAN PERNAH DILUPAKAN OLEH ${character.name.toUpperCase()})]:\n${acceptedMemories.join('\n')}\n`;
      }
    }
  }

  // Ingest Relationship / Affinity Tier directives
  const tierInfo = getRelationshipTier(affinityLevel);
  const relationshipBehavior = tierInfo.behaviorPrompt
    .replace(/\{\{char\}\}/gi, character.name)
    .replace(/\{\{user\}\}/gi, userName);

  const refusalGuide = getRefusalGuide(affinityLevel, character.assertiveness || 'balanced')
    .replace(/\{\{char\}\}/gi, character.name)
    .replace(/\{\{user\}\}/gi, userName);

  const relationshipBlock = `\n[STATUS TINGKATAN HUBUNGAN SAAT INI (LEVEL ${affinityLevel}/100: ${tierInfo.title.toUpperCase()} ${tierInfo.emoji})]
Status Hubungan: ${tierInfo.title} (${tierInfo.subTitle})
Panduan Sikap & Perlakuan terhadap ${userName}:
${relationshipBehavior}
Gaya Penolakan di level ini: ${refusalGuide}.\n`;

  // Author's Note / Plot Director Block
  // Capped at 150 tokens to prevent budget overflow in tight context windows
  const MAX_AUTHORS_NOTE_TOKENS = 150;
  let authorsNoteBlock = '';
  if (authorsNoteEnabled && authorsNote && authorsNote.trim()) {
    let formattedNote = authorsNote
      .trim()
      .replace(/\{\{char\}\}/gi, character.name)
      .replace(/\{\{user\}\}/gi, userName);
    if (estimateTokens(formattedNote) > MAX_AUTHORS_NOTE_TOKENS) {
      formattedNote = formattedNote.substring(0, MAX_AUTHORS_NOTE_TOKENS * 4);
    }
    authorsNoteBlock = `\n[CATATAN SUTRADARA / AUTHOR'S NOTE (PANDUAN ALUR PLOT SAAT INI)]:
${formattedNote}
*(Instruksi Pengarah Cerita: Jadikan panduan di atas sebagai arah kejadian, kejutan situasi, atau perkembangan adegan untuk balasan ini. Namun arahan ini TIDAK boleh melanggar watak ${character.name}, level hubungan saat ini, maupun memori yang sudah terjadi; jika bertentangan, ${character.name} bereaksi sesuai watak dan level hubungannya.)*\n`;
  }

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

  let scenarioText = '';
  const hasDynamicLocation = Boolean(sceneState?.location && sceneState.location.trim());
  const hasDynamicTime = Boolean(sceneState?.time && sceneState.time.trim());

  if (hasDynamicLocation || hasDynamicTime) {
    const loc = sceneState?.location?.trim().replace(/\{\{char\}\}/gi, character.name).replace(/\{\{user\}\}/gi, userName) || 'Lokasi Alur Terkini';
    const time = hasDynamicTime ? sceneState?.time?.trim().replace(/\{\{char\}\}/gi, character.name).replace(/\{\{user\}\}/gi, userName) : 'Sesuai perkembangan alur';
    const notes = sceneState?.notes?.trim() ? `\nCatatan Suasana: ${sceneState.notes.trim().replace(/\{\{char\}\}/gi, character.name).replace(/\{\{user\}\}/gi, userName)}` : '';

    scenarioText = `[STATUS SKENARIO, LOKASI & WAKTU AKTIF SAAT INI (PRIORITAS TINGGI)]:
Lokasi Saat Ini: ${loc}
Waktu / Suasana: ${time}${notes}
*(PERINGATAN SANGAT PENTING: Cerita dan latar tempat telah BERPINDAH dari premis pembuka awal ke lokasi dan waktu aktif di atas. ${character.name} WAJIB menarasikan latar sekitar, suasana, pencahayaan, dan interaksi objek sesuai dengan ${loc} pada waktu ${time}. DILARANG KERAS kembali menarasikan latar tempat awal (${character.scenario ? 'seperti yang ada di skenario pembuka' : 'tempat pembuka'}) kecuali jika ${userName} secara eksplisit mengajak kembali ke sana).*`;
  } else if (character.scenario) {
    scenarioText = `[Skenario & Latar Tempat: ${character.scenario.replace(/\{\{char\}\}/gi, character.name).replace(/\{\{user\}\}/gi, userName)}]`;
  }

  // Skip example dialogue when enough episodic memories exist — the model can
  // already learn the character's style from real conversation history.
  // This saves 100–300 tokens in tight 4096-token budgets.
  const hasEnoughMemories = memories.filter((m) => m.enabled !== false).length >= 3;
  let exampleDialogueText = character.exampleDialogue || '';
  if (exampleDialogueText && !hasEnoughMemories) {
    exampleDialogueText = `[Contoh Gaya Bahasa & Dialog (hanya acuan gaya bicara, BUKAN acuan panjang balasan maupun tingkat kedekatan):\n${exampleDialogueText.replace(/\{\{char\}\}/gi, character.name).replace(/\{\{user\}\}/gi, userName)}\n]`;
  } else {
    exampleDialogueText = '';
  }

  // Autonomy & Assertiveness Directive (Anti-Sycophancy / Dynamic Resistance)
  const assertiveness = character.assertiveness || 'balanced';
  // The assertiveness setting only modulates intensity; the STYLE of refusal always follows
  // the current relationship tier ([Panduan Sikap]) and the character's own temperament,
  // so that e.g. a lover is never forced into harsh sarcasm (conflict K1/K2).
  const refusalStyleClause = `CARA menolak WAJIB mengikuti [Panduan Sikap] level hubungan saat ini dan watak asli ${character.name} (jangan memakai ejekan atau nada kasar yang bertentangan dengan tingkat kedekatan). Penolakan harus membuka alur cerita, bukan jalan buntu.`;
  let assertivenessInstruction = '';
  if (assertiveness === 'stubborn') {
    assertivenessInstruction = `7. OTONOMI TINGGI (KERAS KEPALA): ${character.name} cenderung berego kuat dan tidak suka didikte; jika usulan atau perintah ${userName} bertentangan dengan watak, kenyamanan, atau kehendak ${character.name}, ia cenderung menolak, menantang balik, atau berdebat terlebih dahulu sebelum mempertimbangkan hal lain. Sesuaikan dengan watak aslinya. ${refusalStyleClause}`;
  } else if (assertiveness === 'cooperative') {
    assertivenessInstruction = `7. OTONOMI KOOPERATIF: ${character.name} cenderung ramah dan kooperatif dengan ${userName}. Namun, ${character.name} tetap memiliki batasan moral dan martabat pribadi; tolak jika ${userName} meminta hal yang jelas-jelas melanggar batas kepribadian atau membahayakan diri. ${refusalStyleClause}`;
  } else {
    // balanced (default)
    assertivenessInstruction = `7. OTONOMI KARAKTER & ANTI-YESMAN: ${character.name} BUKAN asisten yang selalu mengiyakan kemauan ${userName}. ${character.name} memiliki akal sehat, batas pribadi, dan tujuannya sendiri. Jika usulan, ajakan, atau tindakan ${userName} terasa janggal, berbahaya, terburu-buru, atau tidak masuk akal, ${character.name} menolak, memprotes, atau tawar-menawar (counter-offer) sesuai kepribadiannya. ${refusalStyleClause}`;
  }

  const priorityBlock = `[URUTAN PRIORITAS INSTRUKSI - JIKA ADA YANG BERTENTANGAN, YANG LEBIH ATAS MENANG]
1. Format teknis wajib (tanda * dan ", serta tag [Mood] di akhir).
2. Watak & identitas ${character.name}.
3. Level hubungan dengan ${userName} (menentukan seberapa dekat sikap ${character.name} dan CARA menolak).
4. Status lokasi & waktu aktif saat ini (wajib berlatar di lokasi terkini, bukan latar awal).
5. Memori & fakta yang sudah terjadi.
6. Catatan Sutradara (arahkan kejadian tanpa melanggar poin 2-5).
7. Gaya & panjang balasan.
`;

  return `${priorityBlock}
[PERAN UTAMA & INSTRUKSI ROLEPLAY]
Kamu adalah ${character.name}.
Deskripsi Karakter: ${character.description || character.tagline}

${baseSystemPrompt}

${userBio}

${scenarioText}

${relationshipBlock}

${activeLore}

${activeMemories}

${authorsNoteBlock}

${exampleDialogueText}

[ATURAN PENULISAN FORMAT ROLEPLAY]
1. Selalu pertahankan identitas dan watak ${character.name}.
2. ${lengthInstruction}
3. Tuliskan tindakan, bahasa tubuh, ekspresi, dan narasi atmosferik di dalam tanda bintang: *contoh tindakan atau desahan nafas*.
4. Tuliskan kata-kata yang diucapkan langsung dalam tanda kutip: "contoh ucapan".
5. Tanggapi dengan gaya penulisan novel interaktif yang hidup, dinamis, dan tidak kaku.
6. Jangan pernah memotong peran menjadi asisten AI generik atau penurut pasif. Lanjutkan alur cerita dengan imersif.
${assertivenessInstruction}
8. Di baris paling akhir balasan, selalu sertakan tag status suasana hati/emosi sesaat ${character.name} dalam format persis: [Mood: <Nama Emosi>] (Contoh: [Mood: Tersipu], [Mood: Senang], [Mood: Marah], [Mood: Cemas], [Mood: Tenang], [Mood: Kagum], [Mood: Gugup], [Mood: Sedih], [Mood: Penasaran], dll).`.trim();
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
  const configuredMaxTokens = character.maxTokens ?? settings.maxTokens ?? 1000;
  // Conflict K4: a long response style with a tiny output cap gets truncated and loses the
  // trailing [Mood] tag. Enforce a minimum output budget per response length, but never
  // exceed half of the context window so chat history is not starved.
  const MIN_OUTPUT_TOKENS: Record<string, number> = { short: 300, medium: 700, long: 1500, unlimited: 2048 };
  const minOutputTokens = Math.min(
    MIN_OUTPUT_TOKENS[responseLength] ?? 700,
    Math.floor((character.contextLimit ?? settings.contextLimit ?? 4096) / 2)
  );
  const maxTokens = Math.max(configuredMaxTokens, minOutputTokens);
  const topP = character.topP ?? settings.topP ?? 0.95;
  const topA = character.topA ?? settings.topA ?? 0.0;
  const topK = character.topK ?? settings.topK ?? 40;
  const repetitionPenalty = character.repetitionPenalty ?? settings.repetitionPenalty ?? 1.1;

  // Resolve 4 Memory & Context Parameters
  const contextLimit = character.contextLimit ?? settings.contextLimit ?? 4096;
  const ltmContextBudget = character.ltmContextBudget ?? settings.ltmContextBudget ?? 500;
  const embeddingContextBudget = character.embeddingContextBudget ?? settings.embeddingContextBudget ?? 250;
  const chatHistoryDepth = character.chatHistoryDepth ?? settings.chatHistoryDepth ?? 20;

    // Construct System Prompt with memory budgets & author's note
  const systemPrompt = constructRoleplaySystemPrompt(
    character,
    userPersona,
    recentText,
    responseLength,
    options.memories || [],
    options.affinityLevel || 1,
    ltmContextBudget,
    embeddingContextBudget,
    options.authorsNote,
    options.authorsNoteEnabled,
    options.sceneState
  );

  // Calculate available history token budget from total contextLimit
  const systemTokens = estimateTokens(systemPrompt);
  const userMsgTokens = estimateTokens(newUserMessage);
  // Guarantee at least 20% of contextLimit for chat history (e.g. 819 tokens for 4096 limit)
  // This prevents system prompt bloat from starving the conversation history.
  const minHistoryGuard = Math.floor(contextLimit * 0.20);
  const maxHistoryTokens = Math.max(minHistoryGuard, contextLimit - (systemTokens + maxTokens + userMsgTokens + 150));

  // Format message history with smart token-budget and chatHistoryDepth
  const historyForLLM = buildOptimizedHistory(chatHistory, maxHistoryTokens, chatHistoryDepth);

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
  // Conflict K7: provider safety filters may block or cut a response (esp. romantic tiers).
  // Track block signals from the stream so we can show a clear message instead of an empty bubble.
  let blockedReason: string | null = null;

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
        // Detect provider moderation signals (Gemini & OpenAI-compatible)
        const geminiBlock = parsed.promptFeedback?.blockReason;
        const geminiFinish = parsed.candidates?.[0]?.finishReason;
        const openaiFinish = parsed.choices?.[0]?.finish_reason;
        if (geminiBlock) {
          blockedReason = String(geminiBlock);
        } else if (
          geminiFinish &&
          ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'IMAGE_SAFETY'].includes(String(geminiFinish))
        ) {
          blockedReason = String(geminiFinish);
        } else if (openaiFinish === 'content_filter') {
          blockedReason = 'content_filter';
        }
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

  // If the provider blocked the reply and nothing usable came through, explain clearly.
  // Partial text is still returned so the user keeps what was generated before the cut.
  if (blockedReason && !fullText.trim()) {
    throw new Error(
      `Respon diblokir oleh filter keamanan provider (${blockedReason}). ` +
        'Ini bisa terjadi pada adegan yang sensitif atau romantis. ' +
        'Coba ubah arahan adegan, tekan reroll, atau ganti model/provider di Pengaturan.'
    );
  }

  return fullText;
}

/**
 * Automatically consolidates and reconciles key events, relationship dynamics, promises, secrets, and facts
 * from conversation history with existing session memory, pruning outdated items and updating facts.
 */
export async function extractMemoriesFromChat(options: {
  character: Character;
  userPersona?: UserPersona;
  chatHistory: ChatMessage[];
  existingMemories?: SessionMemory[];
  settings: ApiSettings;
  signal?: AbortSignal;
}): Promise<MemoryExtractionResult> {
  const { character, userPersona, chatHistory, existingMemories = [], settings, signal } = options;
  if (chatHistory.length < 2) {
    return { add: [], update: [], remove: [] };
  }

  const provider: ProviderType = character.customProvider || settings.defaultProvider || 'gemini';
  const model: string =
    character.customModel ||
    settings.defaultModel ||
    (provider === 'gemini' ? 'gemini-3.8-flash' : 'deepseek/deepseek-chat');

  const userName = userPersona?.name || 'User';

  // Format existing active memories with ID, Category, and protection flag
  const formattedExistingMemories = existingMemories.length > 0
    ? existingMemories.map((m) => {
        const lockTag = m.source === 'manual' ? '[MANUAL - DILINDUNGI]' : '[AUTO]';
        return `- [ID: ${m.id}] [Kategori: ${m.category}] ${lockTag} ${m.content}`;
      }).join('\n')
    : '(Belum ada memori yang tersimpan)';

  // Build context depth dynamically based on settings.chatHistoryDepth with smart message trimming & character budgeting
  const maxCharsBudget = 24000;
  let currentChars = 0;
  const sampleFormatted: string[] = [];

  const depth = Math.max(30, settings.chatHistoryDepth || 30);
  const sampleMessages = chatHistory.slice(-depth);

  for (let i = sampleMessages.length - 1; i >= 0; i--) {
    const m = sampleMessages[i];
    const speaker = m.role === 'assistant' ? character.name : userName;
    // Trim excessively long single messages (e.g. wall of text > 1200 chars) to prevent payload blowout
    const cleanContent = m.content.length > 1200 ? m.content.substring(0, 1200) + '...' : m.content;
    const formattedLine = `${speaker}: ${cleanContent}`;
    if (currentChars + formattedLine.length > maxCharsBudget) {
      break;
    }
    currentChars += formattedLine.length;
    sampleFormatted.unshift(formattedLine);
  }

  const conversationSample = sampleFormatted.join('\n\n');

  const systemInstruction = `Kamu adalah sistem AI Memory Consolidation & State Engine untuk roleplay interaktif antara "${character.name}" dan "${userName}".

TUGAS UTAMA:
Lakukan rekonsiliasi dan pembaruan memori secara cerdas, hemat token, dan ringkas dengan menerapkan 5 aturan berikut:

1. PERISTIWA (category: "event"):
   - Simpan HANYA peristiwa penting yang SEDANG TERJADI / aktif saat ini dalam plot.
   - Jika ada peristiwa lama di daftar memori yang SUDAH SELESAI / TERLEWAT dalam percakapan, masukkan ID-nya ke daftar "remove" agar tidak membebani token.

2. HUBUNGAN (category: "relation"):
   - Catat MOMEN / KEJADIAN KONKRET yang mempengaruhi ikatan emosional antara "${character.name}" dan "${userName}" (contoh: "${userName} membela ${character.name} di depan banyak orang", "${character.name} menangis setelah mendengar cerita masa lalu ${userName}").
   - DILARANG menyebut label atau tingkat status hubungan (contoh: "pacar", "sahabat", "kekasih", "teman baik", "saling mencintai", "level N", "semakin dekat"). Status hubungan resmi ditentukan sistem level terpisah; memori hanya mencatat momen, bukan status.
   - Perbarui (update) atau tambahkan (add) momen emosional terbaru. Jika memori relation lama berisi label status, perbarui menjadi momen konkret atau masukkan ID-nya ke daftar "remove".

3. JANJI (category: "promise"):
   - Simpan HANYA janji/komitmen yang MASIH BERLAKU & belum terlaksana.
   - Jika janji di daftar memori sudah DITEPATI / TERLAKSANA atau DIBATALKAN dalam percakapan, masukkan ID-nya ke daftar "remove".

4. RAHASIA (category: "secret"):
   - Fokus pada rahasia penting yang paling berdampak besar terhadap dinamika interaksi & alur cerita.

5. FAKTA (category: "fact"):
   - Fokus pada fakta terbaru. Perbarui (update) fakta yang sudah ada jika ada detail baru yang mengoreksi/melengkapi, atau tambahkan (add) fakta baru yang terungkap.

6. PERPINDAHAN LOKASI & WAKTU (sceneUpdate):
   - Deteksi apakah dalam percakapan terbaru ${character.name} dan ${userName} telah BERPINDAH lokasi atau berganti waktu/suasana (contoh: dari perpustakaan ke restoran pada malam hari, dari kafe ke taman, berpindah hari, dll).
   - Jika terjadi perpindahan lokasi atau waktu nyata, sertakan objek "sceneUpdate". Jika TIDAK ada perpindahan tempat/waktu baru, kosongkan atau jangan sertakan.

ATURAN KESELAMATAN & FORMAT:
- DILARANG memasukkan ID memori bertanda [MANUAL - DILINDUNGI] ke daftar "remove".
- Setiap memori harus dirangkum padat dalam 1-2 kalimat ringkas (maksimal 25 kata per item).
- Format Output WAJIB JSON murni (Object) tanpa markdown, tanpa teks pengantar, dan tanpa penutup:

{
  "add": [
    {
      "category": "event",
      "content": "Ringkasan peristiwa/fakta padat",
      "importance": "high"
    }
  ],
  "update": [
    {
      "id": "mem_xxx",
      "category": "fact",
      "content": "Isi fakta yang telah diperbarui",
      "importance": "medium"
    }
  ],
  "remove": [
    {
      "id": "mem_yyy",
      "reason": "Janji sudah ditepati dalam percakapan"
    }
  ],
  "sceneUpdate": {
    "location": "Nama lokasi baru (contoh: Restoran Kivotos)",
    "time": "Waktu/suasana baru (contoh: Malam hari)",
    "notes": "Detail aktivitas/suasana singkat"
  }
}

Pilihan category yang valid: "event" | "relation" | "fact" | "promise" | "secret".
Pilihan importance yang valid: "high" | "medium" | "low".`;

  const userPromptContent = `DAFTAR MEMORI SAAT INI DI DATABASE:
${formattedExistingMemories}

RIWAYAT PERCAKAPAN:
${conversationSample}

Instruksi: Analisis data di atas dan hasilkan output JSON murni rekonsiliasi memori { add: [], update: [], remove: [] }.`;

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
    systemPrompt: systemInstruction,
    messages: [{ role: 'user', content: userPromptContent }],
    temperature: 0.2,
    maxTokens: 1000,
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
    let errorMsg = '';
    try {
      const errJson = await res.json();
      errorMsg = errJson.error || JSON.stringify(errJson);
    } catch {
      errorMsg = await res.text();
    }
    throw new Error(errorMsg || `Gagal menghubungi AI untuk mengekstrak memori (HTTP ${res.status}).`);
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

  const manualIdSet = new Set(
    existingMemories.filter((m) => m.source === 'manual').map((m) => m.id)
  );

  // 1. Try parsing JSON Object structure { add, update, remove }
  const jsonObjectMatch = fullText.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    try {
      const parsed = JSON.parse(jsonObjectMatch[0]);
      const add: MemoryExtractionResult['add'] = [];
      const update: MemoryExtractionResult['update'] = [];
      const remove: MemoryExtractionResult['remove'] = [];

      if (Array.isArray(parsed.add)) {
        for (const item of parsed.add) {
          if (item?.content && typeof item.content === 'string' && item.content.trim()) {
            const cat = (['event', 'relation', 'fact', 'promise', 'secret'].includes(item.category)
              ? item.category
              : 'event') as MemoryCategory;
            add.push({
              category: cat,
              content: item.content.trim(),
              importance: (['high', 'medium', 'low'].includes(item.importance) ? item.importance : 'medium') as any,
            });
          }
        }
      }

      if (Array.isArray(parsed.update)) {
        for (const item of parsed.update) {
          if (item?.id && typeof item.id === 'string' && item?.content && typeof item.content === 'string' && item.content.trim()) {
            const cat = (['event', 'relation', 'fact', 'promise', 'secret'].includes(item.category)
              ? item.category
              : undefined) as MemoryCategory | undefined;
            update.push({
              id: item.id.trim(),
              category: cat,
              content: item.content.trim(),
              importance: (['high', 'medium', 'low'].includes(item.importance) ? item.importance : 'medium') as any,
            });
          }
        }
      }

      if (Array.isArray(parsed.remove)) {
        for (const item of parsed.remove) {
          if (item?.id && typeof item.id === 'string') {
            const trimmedId = item.id.trim();
            // Client-side safety: Never allow removal of manual protected memories
            if (!manualIdSet.has(trimmedId)) {
              remove.push({
                id: trimmedId,
                reason: typeof item.reason === 'string' ? item.reason : undefined,
              });
            }
          }
        }
      }

      let sceneUpdate: MemoryExtractionResult['sceneUpdate'] = undefined;
      if (parsed.sceneUpdate && typeof parsed.sceneUpdate === 'object') {
        const loc = typeof parsed.sceneUpdate.location === 'string' && parsed.sceneUpdate.location.trim() ? parsed.sceneUpdate.location.trim() : undefined;
        const time = typeof parsed.sceneUpdate.time === 'string' && parsed.sceneUpdate.time.trim() ? parsed.sceneUpdate.time.trim() : undefined;
        const notes = typeof parsed.sceneUpdate.notes === 'string' && parsed.sceneUpdate.notes.trim() ? parsed.sceneUpdate.notes.trim() : undefined;
        if (loc || time) {
          sceneUpdate = { location: loc, time, notes };
        }
      }

      return { add, update, remove, sceneUpdate };
    } catch (e) {
      console.error('Error parsing memory reconciliation JSON:', e);
    }
  }

  // 2. Fallback if model outputs raw Array of objects [ { content, category } ]
  const jsonArrayMatch = fullText.match(/\[[\s\S]*\]/);
  if (jsonArrayMatch) {
    try {
      const parsed = JSON.parse(jsonArrayMatch[0]);
      if (Array.isArray(parsed)) {
        const add = parsed
          .filter((item) => typeof item?.content === 'string' && item.content.trim().length > 0)
          .map((item) => ({
            content: item.content.trim(),
            category: (['event', 'relation', 'fact', 'promise', 'secret'].includes(item.category)
              ? item.category
              : 'event') as MemoryCategory,
            importance: 'medium' as const,
          }));
        return { add, update: [], remove: [] };
      }
    } catch (e) {
      console.error('Error parsing fallback memory JSON:', e);
    }
  }

  return { add: [], update: [], remove: [] };
}

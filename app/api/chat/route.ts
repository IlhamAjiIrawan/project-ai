import { NextRequest, NextResponse } from 'next/server';
import { ApiSettings, ProviderType } from '@/types';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_PROVIDERS: ProviderType[] = ['gemini', 'openrouter', 'groq', 'openai', 'custom'];
const MAX_PAYLOAD_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_SYSTEM_PROMPT_LENGTH = 60000;
const MAX_MESSAGES_COUNT = 100;
const MAX_MESSAGE_CONTENT_LENGTH = 32000;

interface ChatRequestBody {
  provider: ProviderType;
  model: string;
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  settings: ApiSettings;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check (30 requests per minute per IP)
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(clientIp, { windowMs: 60000, maxRequests: 30 });
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Terlalu banyak permintaan (Rate limit tercapai). Silakan tunggu ${rateLimit.retryAfterSeconds} detik sebelum mengirim lagi.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetTime),
          },
        }
      );
    }

    // 2. Content-Length Header Check
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran data permintaan terlalu besar (maksimal 2MB).' },
        { status: 413 }
      );
    }

    // 3. Body Parsing & Structural Validation
    let body: ChatRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Payload JSON tidak valid.' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Format permintaan tidak valid.' }, { status: 400 });
    }

    const {
      provider = 'gemini',
      model,
      systemPrompt = '',
      messages = [],
      temperature = 0.8,
      maxTokens = 1000,
      topP = 0.95,
      settings,
    } = body;

    // Validate provider
    if (!VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: `Provider "${provider}" tidak didukung.` }, { status: 400 });
    }

    // Validate settings
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Konfigurasi pengaturan API tidak ditemukan.' }, { status: 400 });
    }

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Daftar pesan percakapan tidak boleh kosong.' }, { status: 400 });
    }
    if (messages.length > MAX_MESSAGES_COUNT) {
      return NextResponse.json(
        { error: `Jumlah riwayat pesan melebihi batas (maksimal ${MAX_MESSAGES_COUNT} pesan).` },
        { status: 400 }
      );
    }

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg || typeof msg !== 'object' || typeof msg.content !== 'string') {
        return NextResponse.json({ error: `Pesan ke-${i + 1} memiliki format tidak valid.` }, { status: 400 });
      }
      if (msg.content.length > MAX_MESSAGE_CONTENT_LENGTH) {
        return NextResponse.json(
          { error: `Pesan ke-${i + 1} terlalu panjang (maksimal ${MAX_MESSAGE_CONTENT_LENGTH} karakter).` },
          { status: 400 }
        );
      }
    }

    // Validate systemPrompt length
    if (typeof systemPrompt === 'string' && systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH) {
      return NextResponse.json(
        { error: `System prompt terlalu panjang (maksimal ${MAX_SYSTEM_PROMPT_LENGTH} karakter).` },
        { status: 400 }
      );
    }

    // Clamp parameters
    const safeTemperature = typeof temperature === 'number' ? Math.max(0, Math.min(2.0, temperature)) : 0.8;
    const safeMaxTokens = typeof maxTokens === 'number' ? Math.max(1, Math.min(8192, Math.floor(maxTokens))) : 1000;
    const safeTopP = typeof topP === 'number' ? Math.max(0, Math.min(1.0, topP)) : 0.95;

    // Validate and dispatch to appropriate provider
    if (provider === 'gemini') {
      return await handleGemini(systemPrompt, messages, model, safeTemperature, safeMaxTokens, safeTopP, settings);
    } else if (provider === 'openrouter') {
      return await handleOpenRouter(systemPrompt, messages, model, safeTemperature, safeMaxTokens, safeTopP, settings);
    } else if (provider === 'groq') {
      return await handleOpenAICompatible(
        'https://api.groq.com/openai/v1/chat/completions',
        settings.groqApiKey,
        model || 'llama-3.3-70b-versatile',
        systemPrompt,
        messages,
        safeTemperature,
        safeMaxTokens,
        safeTopP,
        'Groq'
      );
    } else if (provider === 'openai') {
      return await handleOpenAICompatible(
        'https://api.openai.com/v1/chat/completions',
        settings.openaiApiKey,
        model || 'gpt-4o-mini',
        systemPrompt,
        messages,
        safeTemperature,
        safeMaxTokens,
        safeTopP,
        'OpenAI'
      );
    } else if (provider === 'custom') {
      const rawBaseUrl = settings.customBaseUrl?.trim() || 'http://localhost:11434/v1';
      
      // Basic SSRF & protocol validation
      if (!rawBaseUrl.startsWith('http://') && !rawBaseUrl.startsWith('https://')) {
        return NextResponse.json(
          { error: 'Custom Base URL harus menggunakan protokol http:// atau https://' },
          { status: 400 }
        );
      }

      // Validate: block bare ollama.com homepage (not a valid API endpoint)
      // Note: https://ollama.com/v1 IS a valid Ollama Cloud API endpoint — do NOT block it.
      const ollamaHomepagePattern = /^https?:\/\/(?:www\.)?ollama\.com\/?$/i;
      if (ollamaHomepagePattern.test(rawBaseUrl)) {
        return NextResponse.json(
          {
            error:
              'URL "https://ollama.com" adalah halaman utama website Ollama, bukan endpoint API. ' +
              'Untuk Ollama Cloud, gunakan "https://ollama.com/v1". ' +
              'Untuk Ollama lokal di komputer Anda, gunakan "http://localhost:11434/v1".',
          },
          { status: 400 }
        );
      }

      let endpoint = rawBaseUrl;
      if (!endpoint.endsWith('/chat/completions')) {
        endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions';
      }

      const customApiKey = settings.customApiKey?.trim();
      const isCloudEndpoint = endpoint.includes('ollama.com') || (!endpoint.includes('localhost') && !endpoint.includes('127.0.0.1') && !endpoint.includes('0.0.0.0'));

      if (!customApiKey && isCloudEndpoint) {
        return NextResponse.json(
          {
            error: 'API Key untuk Custom Provider belum diisi. Untuk Ollama Cloud (https://ollama.com/v1), masukkan API Key dari akun Ollama kamu di pengaturan.',
          },
          { status: 400 }
        );
      }

      const finalApiKey = customApiKey || 'ollama'; // 'ollama' only valid for local servers without auth
      const customModel = settings.customModelName?.trim() || model || 'llama3';

      return await handleOpenAICompatible(
        endpoint,
        finalApiKey,
        customModel,
        systemPrompt,
        messages,
        safeTemperature,
        safeMaxTokens,
        safeTopP,
        'Custom/Ollama'
      );
    } else {
      return NextResponse.json({ error: `Provider "${provider}" tidak didukung.` }, { status: 400 });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses permintaan AI.';
    console.error('Chat API Route Error:', err);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}

// 1. Handler Gemini
async function handleGemini(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  model: string,
  temperature: number,
  maxTokens: number,
  topP: number,
  settings: ApiSettings
) {
  const apiKey = settings.geminiApiKey?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Gemini API Key belum diatur di menu Pengaturan.' },
      { status: 400 }
    );
  }

  let modelName = model || 'gemini-3.8-flash';
  if (modelName === 'gemini-2.5-flash') {
    modelName = 'gemini-3.8-flash';
  }
  if (modelName.startsWith('models/')) {
    modelName = modelName.replace('models/', '');
  }

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  for (const msg of messages) {
    if (msg.role === 'system') continue;
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const payload = {
    contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: 'Halo' }] }],
    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      topP,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    return NextResponse.json(
      { error: `Gemini API Error (${response.status}): ${errorDetail}` },
      { status: response.status }
    );
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// 2. Handler OpenRouter
async function handleOpenRouter(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  model: string,
  temperature: number,
  maxTokens: number,
  topP: number,
  settings: ApiSettings
) {
  const apiKey = settings.openRouterApiKey?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenRouter API Key belum diatur di menu Pengaturan.' },
      { status: 400 }
    );
  }

  const formattedMessages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }
  for (const msg of messages) {
    formattedMessages.push({ role: msg.role, content: msg.content });
  }

  const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Roleplay AI Hub',
    },
    body: JSON.stringify({
      model: model || 'deepseek/deepseek-chat',
      messages: formattedMessages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream: true,
    }),
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    return NextResponse.json(
      { error: `OpenRouter Error (${response.status}): ${errorDetail}` },
      { status: response.status }
    );
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// 3. Handler OpenAI-Compatible (Groq, OpenAI, Ollama / Local AI)
async function handleOpenAICompatible(
  endpoint: string,
  apiKey: string | undefined,
  modelName: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number,
  maxTokens: number,
  topP: number,
  providerLabel: string
) {
  const formattedMessages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }
  for (const msg of messages) {
    formattedMessages.push({ role: msg.role, content: msg.content });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  let response: globalThis.Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: modelName,
        messages: formattedMessages,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        stream: true,
      }),
    });
  } catch (networkErr: unknown) {
    const errorMsg = networkErr instanceof Error ? networkErr.message : String(networkErr);
    if (providerLabel === 'Custom/Ollama') {
      const isCloud = endpoint.includes('ollama.com');
      const cloudHint = isCloud
        ? `Pastikan:\n1. API Key Ollama Cloud Anda sudah diisi dengan benar di pengaturan.\n2. Model "${modelName}" tersedia di katalog Ollama Cloud (https://ollama.com/models).\n3. Akun Ollama Cloud Anda memiliki akses ke model tersebut.`
        : `Pastikan:\n1. Server Ollama lokal sedang berjalan di komputer Anda.\n2. Gunakan URL: http://localhost:11434/v1\n3. Model "${modelName}" sudah didownload (Jalankan: 'ollama pull ${modelName}').`;
      return NextResponse.json(
        {
          error: `Gagal terhubung ke server ${providerLabel} di (${endpoint}).\n\n${cloudHint}`,
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: `Gagal menghubungi server ${providerLabel}: ${errorMsg}` },
      { status: 502 }
    );
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.error?.message || errJson.error || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }

    if (providerLabel === 'Custom/Ollama' && (response.status === 404 || errorDetail.includes('not found') || errorDetail.includes('model'))) {
      return NextResponse.json(
        {
          error: `Ollama merespon error (${response.status}): Model "${modelName}" tidak ditemukan di Ollama Anda.\n\nSilakan buka terminal dan unduh model tersebut terlebih dahulu, contoh:\nollama pull ${modelName}\natau\nollama run ${modelName}`,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { error: `${providerLabel} Error (${response.status}): ${errorDetail}` },
      { status: response.status }
    );
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

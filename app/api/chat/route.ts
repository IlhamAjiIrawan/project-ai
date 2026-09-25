import { NextRequest, NextResponse } from 'next/server';
import { ApiSettings, ProviderType } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    const body: ChatRequestBody = await req.json();
    const {
      provider = 'gemini',
      model,
      systemPrompt,
      messages,
      temperature = 0.8,
      maxTokens = 1000,
      topP = 0.95,
      settings,
    } = body;

    // Validate and dispatch to appropriate provider
    if (provider === 'gemini') {
      return await handleGemini(systemPrompt, messages, model, temperature, maxTokens, topP, settings);
    } else if (provider === 'openrouter') {
      return await handleOpenRouter(systemPrompt, messages, model, temperature, maxTokens, topP, settings);
    } else if (provider === 'groq') {
      return await handleOpenAICompatible(
        'https://api.groq.com/openai/v1/chat/completions',
        settings.groqApiKey,
        model || 'llama-3.3-70b-versatile',
        systemPrompt,
        messages,
        temperature,
        maxTokens,
        topP,
        'Groq'
      );
    } else if (provider === 'openai') {
      return await handleOpenAICompatible(
        'https://api.openai.com/v1/chat/completions',
        settings.openaiApiKey,
        model || 'gpt-4o-mini',
        systemPrompt,
        messages,
        temperature,
        maxTokens,
        topP,
        'OpenAI'
      );
    } else if (provider === 'custom') {
      let rawBaseUrl = settings.customBaseUrl?.trim() || 'http://localhost:11434/v1';
      
      // Helpful URL fix & validation for Ollama
      if (rawBaseUrl.includes('ollama.com')) {
        return NextResponse.json(
          {
            error:
              'URL "https://ollama.com" adalah website resmi Ollama, bukan server API. Jika Anda menjalankan Ollama di komputer Anda, silakan ganti Base URL menjadi "http://localhost:11434/v1" dan pastikan aplikasi Ollama sedang aktif.',
          },
          { status: 400 }
        );
      }

      let endpoint = rawBaseUrl;
      if (!endpoint.endsWith('/chat/completions')) {
        endpoint = endpoint.replace(/\/+$/, '') + '/chat/completions';
      }

      const customApiKey = settings.customApiKey?.trim() || 'ollama';
      const customModel = settings.customModelName?.trim() || model || 'llama3';

      return await handleOpenAICompatible(
        endpoint,
        customApiKey,
        customModel,
        systemPrompt,
        messages,
        temperature,
        maxTokens,
        topP,
        'Custom/Ollama',
        rawBaseUrl
      );
    } else {
      return NextResponse.json({ error: `Provider "${provider}" tidak didukung.` }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Chat API Route Error:', err);
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan saat memproses permintaan AI.' },
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
  providerLabel: string,
  originalBaseUrl?: string
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
  } catch (networkErr: any) {
    if (providerLabel === 'Custom/Ollama') {
      return NextResponse.json(
        {
          error: `Gagal terhubung ke server ${providerLabel} di (${endpoint}).\n\nPastikan:\n1. Server Ollama atau LLM lokal sedang berjalan di komputer Anda.\n2. Jika menggunakan Ollama lokal, gunakan URL: http://localhost:11434/v1\n3. Model "${modelName}" sudah didownload di Ollama (Jalankan: 'ollama run ${modelName}').`,
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: `Gagal menghubungi server ${providerLabel}: ${networkErr.message}` },
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
